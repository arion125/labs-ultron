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
import { SectorCoordinates } from "../common/types";
import { SageFleetHandler } from "../src/SageFleetHandler";
import { SageGameHandler } from "../src/SageGameHandler";
import { actionWrapper } from "../utils/actions/actionWrapper";
import { sendNotification } from "../utils/actions/sendNotification";
import { getTimeAndNeededResourcesToFullCargoInMining } from "../utils/fleets/getTimeAndNeededResourcesToFullCargoInMining";
import { setMiningInputs } from "../utils/inputs/setMiningInputs";
import { calcSectorsDistanceByCoords } from "../utils/sectors/calcSectorsDistanceByCoords";

export const mining = async (
  fleet: Fleet,
  position: SectorCoordinates,
  gh: SageGameHandler,
  fh: SageFleetHandler
) => {
  // 1. prendere in input tutti i dati necessari per il mining di una risorsa
  // - dove vuoi minare
  // - quale risorsa vuoi minare
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

  const distanceCoords =
    starbase && calcSectorsDistanceByCoords(position, starbase);

  const reverseDistanceCoords =
    distanceCoords &&
    (distanceCoords.map((item) => item.neg()) as SectorCoordinates);

  // 3. avviare l'automazione utilizzando i dati forniti dall'utente
  while (true) {
    try {
      await actionWrapper(loadFuel, fleetPubkey, MAX_AMOUNT, gh, fh);
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
      if (starbase && distanceCoords && movementType == "subwarp") {
        await actionWrapper(
          subwarpToSector,
          fleetPubkey,
          distanceCoords,
          gh,
          fh
        );
        await actionWrapper(exitSubwarp, fleetPubkey, gh, fh);
      }
      if (starbase && distanceCoords && movementType == "warp") {
        await actionWrapper(
          warpToSector,
          fleetPubkey,
          distanceCoords,
          gh,
          fh,
          false
        );
        await actionWrapper(exitWarp, fleetPubkey, gh, fh);
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
      if (starbase && reverseDistanceCoords && movementType == "subwarp") {
        await actionWrapper(
          subwarpToSector,
          fleetPubkey,
          reverseDistanceCoords,
          gh,
          fh
        );
        await actionWrapper(exitSubwarp, fleetPubkey, gh, fh);
      }
      if (starbase && reverseDistanceCoords && movementType == "warp") {
        await actionWrapper(
          warpToSector,
          fleetPubkey,
          reverseDistanceCoords,
          gh,
          fh,
          true
        );
        await actionWrapper(exitWarp, fleetPubkey, gh, fh);
      }
      await actionWrapper(dockToStarbase, fleetPubkey, gh, fh);
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
      break;
    }
  }
};
