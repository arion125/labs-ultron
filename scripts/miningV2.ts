import { byteArrayToString } from "@staratlas/data-source";
import { Fleet } from "@staratlas/sage";
import { dockToStarbase } from "../actions/dockToStarbase";
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
import { generateRoute } from "../utils/sectors/generateRoute";
import { SagePlayer } from "../src/SagePlayer";
import { setFleetV2 } from "../utils/inputsV2/setFleet";
import { setCycles } from "../utils/inputs/setCycles";
import { setStarbaseV2 } from "../utils/inputsV2/setStarbase";
import { setResourceToMine } from "../utils/inputsV2/setResourceToMine";
import { setMovementTypeV2 } from "../utils/inputsV2/setMovementType";
import { BN } from "@staratlas/anchor";
import { ResourceName } from "../src/SageGame";
import { CargoPodType } from "../src/SageFleet";

export const miningV2 = async (
  player: SagePlayer,
) => {
  // 1. set cycles
  const cycles = await setCycles();

  // 2. set fleet
  const fleet = await setFleetV2(player);
  if (fleet.type !== "Success") return fleet;

  const currentSector = await fleet.data.getCurrentSectorAsync();
  if (currentSector.type !== "Success") return currentSector;

  // 3. set mining sector
  const starbase = await setStarbaseV2(fleet.data);
  if (starbase.type !== "Success") return starbase;

  const sector = player.getSageGame().getSectorByCoords(starbase.data.data.sector as SectorCoordinates);
  if (sector.type !== "Success") return sector;

  // 4. set mining resource
  const resourceToMine = await setResourceToMine(fleet.data, sector.data);
  if (resourceToMine.type !== "Success") return resourceToMine;

  // calc fuel, ammo and food needed

  // 5. set fleet movement type (->)
  const sectorsDistanceGo = fleet.data.getSageGame().calculateDistanceBySector(currentSector.data, sector.data);
  
  const movementGo = await setMovementTypeV2()

  // If warp, If subwarp

  // calc (route) and fuel needed
  
  // 6. set fleet movement type (<-)
  const sectorsDistanceBack = fleet.data.getSageGame().calculateDistanceBySector(sector.data, currentSector.data);
  
  const movementBack = await setMovementTypeV2()

  // If warp, If subwarp

  // calc (route) and fuel needed

  // 7. start mining loop
  for (let i = 0; i < cycles; i++) {
    // 1. load fuel
    // await actionWrapper(loadFuel, fleet.data, new BN(1000));

    // 2. load ammo
    // await actionWrapper(loadAmmo, fleet.data, new BN(1000));

    // 3. load food
    // await actionWrapper(loadCargo, fleet.data, ResourceName.Fuel, CargoPodType.FuelTank, new BN(3000));
    // await actionWrapper(loadCargo, fleet.data, ResourceName.Food, CargoPodType.FuelTank, new BN(3000));
    
    // 4. undock from starbase
    await actionWrapper(undockFromStarbase, fleet.data);
    await actionWrapper(dockToStarbase, fleet.data);

    // 5. move to sector (->)

    // 6. start mining

    // 7. stop mining

    // 8. move to sector (<-)

    // 9. dock to starbase

    // 10. unload cargo
    // await actionWrapper(unloadCargo, fleet.data, ResourceName.Fuel, CargoPodType.FuelTank, new BN(999999));

    // 11. unload food
  }

  return { type: "Success" as const };
};
