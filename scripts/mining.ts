import { byteArrayToString } from "@staratlas/data-source";
import { Fleet } from "@staratlas/sage";
import { dockToStarbase } from "../actions/dockToStarbase";
import { exitSubwarp } from "../actions/exitSubwarp";
import { exitWarp } from "../actions/exitWarp";
import { loadAmmo } from "../actions/loadAmmo";
import { loadCargo } from "../actions/loadCargo";
import { loadFuel } from "../actions/loadFuel";
import { startMining } from "../actions/startMining";
import { stopMining } from "../actions/stopMining";
import { subwarpToSector } from "../actions/subwarpToSector";
import { undockFromStarbase } from "../actions/undockFromStarbase";
import { unloadCargo } from "../actions/unloadCargo";
import { warpToSector } from "../actions/warpToSector";
import { MAX_AMOUNT } from "../common/constants";
import { NotificationMessage } from "../common/notifications";
import { Resource } from "../common/resources";
import { SageFleetHandler } from "../src/SageFleetHandler";
import { SageGameHandler } from "../src/SageGameHandler";
import { actionWrapper } from "../utils/actions/actionWrapper";
import { sendNotification } from "../utils/actions/sendNotification";
import { getTimeAndNeededResourcesToFullCargoInMining } from "../utils/fleets/getTimeAndNeededResourcesToFullCargoInMining";
import { setMiningInputs } from "../utils/inputs/setMiningInputs";
import { generateRoute } from "../utils/sectors/generateRoute";
import { PublicKey } from "@solana/web3.js";
import { setFleet } from "../utils/inputs/setFleet";

export const mining = async (
  profilePubkey: PublicKey,
  gh: SageGameHandler,
  fh: SageFleetHandler,
  cycles: number
) => {
  // 1. prendere in input tutti i dati necessari per il mining di una risorsa
  // - dove vuoi minare
  // - quale risorsa vuoi minare
  const fleetResponse = await setFleet(
    gh,
    fh,
    profilePubkey
  );
  if (fleetResponse.type !== "Success") return fleetResponse;
  const fleet = fleetResponse.fleet;
  const position = fleetResponse.position;

  const { starbase, movementType, resourceToMine } = await setMiningInputs(
    position
  );

  // 2. calcolare tutti i dati necessari correlati agli input
  const fleetPubkey = fleet.key;
  const fleetName = byteArrayToString(fleet.data.fleetLabel);

  const miningTimeAndResourcesAmount = !starbase
    ? await getTimeAndNeededResourcesToFullCargoInMining(
        fleet,
        resourceToMine,
        position,
        gh,
        fh
      )
    : await getTimeAndNeededResourcesToFullCargoInMining(
        fleet,
        resourceToMine,
        starbase,
        gh,
        fh
      );
  if (miningTimeAndResourcesAmount.type !== "Success")
    return miningTimeAndResourcesAmount;

  // 3. avviare l'automazione utilizzando i dati forniti dall'utente
  for (let i = 0; i < cycles; i++) {
    try {
      await actionWrapper(loadFuel, fleetPubkey, MAX_AMOUNT, gh, fh);

      let routeStart = starbase
        ? await generateRoute(
            fleetPubkey,
            position,
            starbase,
            movementType == "warp",
            gh,
            fh
          )
        : { type: "Success" as const, result: [] };
      if (routeStart.type !== "Success") return routeStart;

      let routeBack = starbase
        ? await generateRoute(
            fleetPubkey,
            starbase,
            position,
            movementType == "warp",
            gh,
            fh
          )
        : { type: "Success" as const, result: [] };
      if (routeBack.type !== "Success") return routeBack;

      await actionWrapper(loadAmmo, fleetPubkey, MAX_AMOUNT, gh, fh);
      await actionWrapper(
        loadCargo,
        fleetPubkey,
        Resource.Food,
        miningTimeAndResourcesAmount.food,
        gh,
        fh
      );
      await actionWrapper(undockFromStarbase, fleetPubkey, gh, fh);

      if (starbase) {
        for (const trip of routeStart.result) {
          if (trip.warp) {
            await actionWrapper(
              warpToSector,
              fleetPubkey,
              trip.from,
              trip.to,
              gh,
              fh,
              !trip.to[0].eq(starbase[0]) || !trip.to[1].eq(starbase[1])
            );
            await actionWrapper(exitWarp, fleetPubkey, gh, fh);
          }
          if (!trip.warp) {
            await actionWrapper(
              subwarpToSector,
              fleetPubkey,
              trip.from,
              trip.to,
              gh,
              fh
            );
            await actionWrapper(exitSubwarp, fleetPubkey, gh, fh);
          }
        }
      }

      await actionWrapper(
        startMining,
        fleetPubkey,
        resourceToMine,
        miningTimeAndResourcesAmount.timeInSeconds,
        gh,
        fh
      );
      await actionWrapper(stopMining, fleetPubkey, resourceToMine, gh, fh);

      if (starbase) {
        for (const trip of routeBack.result) {
          if (trip.warp) {
            await actionWrapper(
              warpToSector,
              fleetPubkey,
              trip.from,
              trip.to,
              gh,
              fh,
              true
            );
            await actionWrapper(exitWarp, fleetPubkey, gh, fh);
          }
          if (!trip.warp) {
            await actionWrapper(
              subwarpToSector,
              fleetPubkey,
              trip.from,
              trip.to,
              gh,
              fh
            );
            await actionWrapper(exitSubwarp, fleetPubkey, gh, fh);
          }
        }
      }

      await actionWrapper(dockToStarbase, fleetPubkey, gh, fh);

      await actionWrapper(
        unloadCargo,
        fleetPubkey,
        Resource.Food,
        MAX_AMOUNT,
        gh,
        fh
      );

      await actionWrapper(
        unloadCargo,
        fleetPubkey,
        resourceToMine,
        MAX_AMOUNT,
        gh,
        fh
      );
      
      await sendNotification(NotificationMessage.MINING_SUCCESS, fleetName);
    } catch (e) {
      await sendNotification(NotificationMessage.MINING_ERROR, fleetName);
      return { type: "Error" as const };
    }
  }

  return { type: "Success" as const };
};
