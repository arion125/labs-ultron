import { dockToStarbase } from "../actions/dockToStarbase";
import { loadCargo } from "../actions/loadCargo";
import { subwarpToSector } from "../actions/subwarpToSector";
import { undockFromStarbase } from "../actions/undockFromStarbase";
import { unloadCargo } from "../actions/unloadCargo";
import { warpToSector } from "../actions/warpToSector";
import { MAX_AMOUNT, MovementType } from "../common/constants";
import { NotificationMessage } from "../common/notifications";
import { InputResourcesForCargo, SectorCoordinates } from "../common/types";
import { actionWrapper } from "../utils/actions/actionWrapper";
import { sendNotification } from "../utils/actions/sendNotification";
import { SagePlayer } from "../src/SagePlayer";
import { setFleetV2 } from "../utils/inputsV2/setFleet";
import { setCycles } from "../utils/inputs/setCycles";
import { setStarbaseV2 } from "../utils/inputsV2/setStarbase";
import { setMovementTypeV2 } from "../utils/inputsV2/setMovementType";
import { BN } from "@staratlas/anchor";
import { ResourceName } from "../src/SageGame";
import { CargoPodType } from "../src/SageFleet";
import { setResourcesAmountV2 } from "../utils/inputsV2/setResourcesAmount";
import { setScanCoordinates } from "../utils/inputsV2/setScanCoordinates";
import { scanSdu } from "../actions/scanSdu";

export const scanV2 = async (
  player: SagePlayer,
) => {
  // 1. set cycles
  const cycles = await setCycles();

  // 2. set fleet
  const fleet = await setFleetV2(player);
  if (fleet.type !== "Success") return fleet;

  const fleetCurrentSector = await fleet.data.getCurrentSector();

  // 3. set sector coords
  const coords = await setScanCoordinates();
  if (coords.type !== "Success") return coords;

  const sector = await player.getSageGame().getSectorByCoordsAsync(coords.data);
  if (sector.type !== "Success") return sector;

  const isSameSector = fleetCurrentSector.key.equals(sector.data.key);

  // 4. set fleet movement type (->)
  const movementGo = await setMovementTypeV2()

  const [goRoute, goFuelNeeded] = fleet.data.calculateRouteToSectorAndFuelNeededByMovement(
    movementGo.movement, 
    fleetCurrentSector, 
    sector.data);
  
  // 5. set fleet movement type (<-) 
  const movementBack = await setMovementTypeV2()

  const [backRoute, backFuelNeeded] = fleet.data.calculateRouteToSectorAndFuelNeededByMovement(
    movementGo.movement, 
    sector.data, 
    fleetCurrentSector);
  
  const fuelNeeded = goFuelNeeded + backFuelNeeded + 10000;
  console.log("Fuel needed:", fuelNeeded);

  const fuelTank = fleet.data.getFuelTank();

  const cargoHold = fleet.data.getCargoHold();

  // 6. start scan loop
  for (let i = 0; i < cycles; i++) {
    // 1. load fuel
    if (fuelTank.loadedAmount < fuelNeeded) {
      await actionWrapper(loadCargo, fleet.data, ResourceName.Fuel, CargoPodType.FuelTank, new BN(MAX_AMOUNT));
    }

    // 2. load tools
    if (!fleet.data.getOnlyDataRunner()) {
      await actionWrapper(loadCargo, fleet.data, ResourceName.Tool, CargoPodType.CargoHold, new BN(MAX_AMOUNT));
    }
    
    // 3. undock from starbase
    await actionWrapper(undockFromStarbase, fleet.data);

    // 4. move to sector (->)
    if (movementGo.movement === MovementType.Warp) {
      for (let i = 1; i < goRoute.length; i++) {
        const sectorTo = goRoute[i];
        await actionWrapper(warpToSector, fleet.data, sectorTo, false);
      }   
    }

    if (movementGo.movement === MovementType.Subwarp) {
      const sectorTo = goRoute[1];
      await actionWrapper(subwarpToSector, fleet.data, sectorTo);
    }

    // 6. scan sector
    for (let i = 1; i < MAX_AMOUNT; i++) {
      const scan = await actionWrapper(scanSdu, fleet.data, i);
      if (scan.type !== "Success") break;
    }

    // 10. move to sector (<-)
    if (movementBack.movement === MovementType.Warp) {
      for (let i = 1; i < backRoute.length; i++) {
        const sectorTo = backRoute[i];
        await actionWrapper(warpToSector, fleet.data, sectorTo, true);
      }   
    }

    if (movementBack.movement === MovementType.Subwarp) {
      const sectorTo = backRoute[i];
      await actionWrapper(subwarpToSector, fleet.data, sectorTo);
    }

    // 11. dock to starbase
    await actionWrapper(dockToStarbase, fleet.data);

    // 12. unload cargo
    await actionWrapper(unloadCargo, fleet.data, ResourceName.Sdu, CargoPodType.CargoHold, new BN(MAX_AMOUNT));
    if (!fleet.data.getOnlyDataRunner()) {
      await actionWrapper(unloadCargo, fleet.data, ResourceName.Tool, CargoPodType.CargoHold, new BN(MAX_AMOUNT));
    }

    // 13. send notification
    await sendNotification(NotificationMessage.SCAN_SUCCESS, fleet.data.getName());
  }

  return { type: "Success" as const };
};
