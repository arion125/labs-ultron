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
import { actionWrapper } from "../utils/actions/actionWrapper";
import { sendNotification } from "../utils/actions/sendNotification";
import { getTimeAndNeededResourcesToFullCargoInMining } from "../utils/fleets/getTimeAndNeededResourcesToFullCargoInMining";
import { setMiningInputs } from "../utils/inputs/setMiningInputs";
import { calcSectorsDistanceByCoords } from "../utils/sectors/calcSectorsDistanceByCoords";

export const mining = async (fleet: Fleet, position: SectorCoordinates) => {
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
        position
      )
    : await getTimeAndNeededResourcesToFullCargoInMining(
        fleet,
        resourceToMine,
        starbase
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
      await actionWrapper(loadFuel, fleetPubkey, MAX_AMOUNT);
      await actionWrapper(loadAmmo, fleetPubkey, MAX_AMOUNT);
      await actionWrapper(
        loadCargo,
        fleetPubkey,
        Resource.Food,
        miningTimeAndResourcesAmount.food
      );
      await actionWrapper(undockFromStarbase, fleetPubkey);
      if (starbase && distanceCoords && movementType == "Subwarp") {
        await actionWrapper(subwarpToSector, fleetPubkey, distanceCoords);
        await actionWrapper(exitSubwarp, fleetPubkey);
      }
      if (
        starbase &&
        distanceCoords &&
        movementType == "Warp - only for one-shot travel (alpha)"
      ) {
        await actionWrapper(warpToSector, fleetPubkey, distanceCoords, false);
        await actionWrapper(exitWarp, fleetPubkey);
      }
      await actionWrapper(
        startMining,
        fleetPubkey,
        resourceToMine,
        miningTimeAndResourcesAmount.timeInSeconds
      );
      await actionWrapper(stopMining, fleetPubkey, resourceToMine);
      if (starbase && reverseDistanceCoords && movementType == "Subwarp") {
        await actionWrapper(
          subwarpToSector,
          fleetPubkey,
          reverseDistanceCoords
        );
        await actionWrapper(exitSubwarp, fleetPubkey);
      }
      if (starbase && reverseDistanceCoords && movementType == "Warp") {
        await actionWrapper(
          warpToSector,
          fleetPubkey,
          reverseDistanceCoords,
          true
        );
        await actionWrapper(exitWarp, fleetPubkey);
      }
      await actionWrapper(dockToStarbase, fleetPubkey);
      await actionWrapper(unloadCargo, fleetPubkey, resourceToMine, MAX_AMOUNT);
      await sendNotification(NotificationMessage.MINING_SUCCESS, fleetName);
    } catch (e) {
      await sendNotification(NotificationMessage.MINING_ERROR, fleetName);
      break;
    }
  }
};
