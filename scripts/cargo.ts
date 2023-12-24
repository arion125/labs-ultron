import { byteArrayToString } from "@staratlas/data-source";
import { Fleet } from "@staratlas/sage";
import { dockToStarbase } from "../actions/dockToStarbase";
import { exitSubwarp } from "../actions/exitSubwarp";
import { loadAmmo } from "../actions/loadAmmo";
import { loadCargo } from "../actions/loadCargo";
import { loadFuel } from "../actions/loadFuel";
import { subwarpToSector } from "../actions/subwarpToSector";
import { undockFromStarbase } from "../actions/undockFromStarbase";
import { unloadCargo } from "../actions/unloadCargo";
import { MAX_AMOUNT } from "../common/constants";
import { NotificationMessage } from "../common/notifications";
import { InputResourcesForCargo, SectorCoordinates } from "../common/types";
import { SageFleetHandler } from "../src/SageFleetHandler";
import { SageGameHandler } from "../src/SageGameHandler";
import { actionWrapper } from "../utils/actions/actionWrapper";
import { sendNotification } from "../utils/actions/sendNotification";
import { setCargoInputs } from "../utils/inputs/setCargoInputs";
import { calcSectorsDistanceByCoords } from "../utils/sectors/calcSectorsDistanceByCoords";

export const cargo = async (
  fleet: Fleet,
  position: SectorCoordinates,
  gh: SageGameHandler,
  fh: SageFleetHandler
) => {
  // 1. prendere in input tutti i dati necessari per il trasporto cargo
  // - dove vuoi andare
  // - quali risorse vuoi trasportare (andata)
  // - quali risorse vuoi trasportare (ritorno)
  // - vuoi spostarti in warp o subwarp (calcolare la rotta)
  const { starbaseTo, resourcesToDestination, resourcesToStarbase } =
    await setCargoInputs(position);

  // 2. calcolare tutti i dati necessari correlati agli input
  const fleetPubkey = fleet.key;
  const fleetName = byteArrayToString(fleet.data.fleetLabel);

  const distanceCoords =
    starbaseTo && calcSectorsDistanceByCoords(position, starbaseTo);

  const reverseDistanceCoords =
    distanceCoords &&
    (distanceCoords.map((item) => item.neg()) as SectorCoordinates);

  let effectiveResourcesToDestination: InputResourcesForCargo[];
  let effectiveResourcesToStarbase: InputResourcesForCargo[];

  // 3. avviare l'automazione utilizzando i dati forniti dall'utente
  while (true) {
    effectiveResourcesToDestination = [];
    effectiveResourcesToStarbase = [];

    try {
      await actionWrapper(loadFuel, fleetPubkey, MAX_AMOUNT, gh, fh);
      await actionWrapper(loadAmmo, fleetPubkey, MAX_AMOUNT, gh, fh);

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
      await actionWrapper(subwarpToSector, fleetPubkey, distanceCoords, gh, fh);
      await actionWrapper(exitSubwarp, fleetPubkey, gh, fh);
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
      await actionWrapper(
        subwarpToSector,
        fleetPubkey,
        reverseDistanceCoords,
        gh,
        fh
      );
      await actionWrapper(exitSubwarp, fleetPubkey, gh, fh);
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
};
