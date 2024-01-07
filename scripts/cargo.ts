import { byteArrayToString } from "@staratlas/data-source";
import { Fleet } from "@staratlas/sage";
import { dockToStarbase } from "../actions/dockToStarbase";
import { exitSubwarp } from "../actions/exitSubwarp";
import { exitWarp } from "../actions/exitWarp";
import { loadCargo } from "../actions/loadCargo";
import { loadFuel } from "../actions/loadFuel";
import { subwarpToSector } from "../actions/subwarpToSector";
import { undockFromStarbase } from "../actions/undockFromStarbase";
import { unloadCargo } from "../actions/unloadCargo";
import { warpToSector } from "../actions/warpToSector";
import { MAX_AMOUNT } from "../common/constants";
import { NotificationMessage } from "../common/notifications";
import { InputResourcesForCargo, SectorCoordinates } from "../common/types";
import { SageFleetHandler } from "../src/SageFleetHandler";
import { SageGameHandler } from "../src/SageGameHandler";
import { actionWrapper } from "../utils/actions/actionWrapper";
import { sendNotification } from "../utils/actions/sendNotification";
import { setCargoInputs } from "../utils/inputs/setCargoInputs";
import { generateRoute } from "../utils/sectors/generateRoute";

export const cargo = async (
  fleet: Fleet,
  position: SectorCoordinates,
  gh: SageGameHandler,
  fh: SageFleetHandler,
  cycles: number
) => {
  // 1. prendere in input tutti i dati necessari per il trasporto cargo
  // - dove vuoi andare
  // - quali risorse vuoi trasportare (andata)
  // - quali risorse vuoi trasportare (ritorno)
  // - vuoi spostarti in warp o subwarp (calcolare la rotta)
  const {
    starbaseTo,
    resourcesToDestination,
    resourcesToStarbase,
    movementType,
  } = await setCargoInputs(position);

  // 2. calcolare tutti i dati necessari correlati agli input
  const fleetPubkey = fleet.key;
  const fleetName = byteArrayToString(fleet.data.fleetLabel);

  let routeStart = starbaseTo
    ? await generateRoute(
        fleetPubkey,
        position,
        starbaseTo,
        movementType == "warp",
        gh,
        fh
      )
    : { type: "StarbaseNotFound" as const };
  if (routeStart.type !== "Success") return routeStart;

  let routeBack = starbaseTo
    ? await generateRoute(
        fleetPubkey,
        starbaseTo,
        position,
        movementType == "warp",
        gh,
        fh
      )
    : { type: "StarbaseNotFound" as const };
  if (routeBack.type !== "Success") return routeBack;

  let effectiveResourcesToDestination: InputResourcesForCargo[];
  let effectiveResourcesToStarbase: InputResourcesForCargo[];

  // 3. avviare l'automazione utilizzando i dati forniti dall'utente
  for (let i = 0; i < cycles; i++) {
    effectiveResourcesToDestination = [];
    effectiveResourcesToStarbase = [];

    try {
      await actionWrapper(loadFuel, fleetPubkey, MAX_AMOUNT, gh, fh);
      //await actionWrapper(loadAmmo, fleetPubkey, MAX_AMOUNT, gh, fh);

      for (const item of resourcesToDestination) {
        await actionWrapper(
          loadCargo,
          fleetPubkey,
          item.resource,
          item.amount,
          gh,
          fh
        );
        effectiveResourcesToDestination.push(item);
      }

      await actionWrapper(undockFromStarbase, fleetPubkey, gh, fh);

      for (const trip of routeStart.result) {
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

      await actionWrapper(dockToStarbase, fleetPubkey, gh, fh);

      for (const item of effectiveResourcesToDestination) {
        await actionWrapper(
          unloadCargo,
          fleetPubkey,
          item.resource,
          item.amount,
          gh,
          fh
        );
      }

      for (const item of resourcesToStarbase) {
        await actionWrapper(
          loadCargo,
          fleetPubkey,
          item.resource,
          item.amount,
          gh,
          fh
        );
        effectiveResourcesToStarbase.push(item);
      }

      await actionWrapper(undockFromStarbase, fleetPubkey, gh, fh);

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

      await actionWrapper(dockToStarbase, fleetPubkey, gh, fh);

      for (const item of effectiveResourcesToStarbase) {
        await actionWrapper(
          unloadCargo,
          fleetPubkey,
          item.resource,
          item.amount,
          gh,
          fh
        );
      }

      await sendNotification(NotificationMessage.CARGO_SUCCESS, fleetName);
    } catch (e) {
      await sendNotification(NotificationMessage.CARGO_ERROR, fleetName);
      break;
    }
  }

  return { type: "Success" as const };
};
