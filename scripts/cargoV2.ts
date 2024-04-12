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

export const cargoV2 = async (
  player: SagePlayer,
) => {
  // 1. set cycles
  const cycles = await setCycles();

  // 2. set fleet
  const fleet = await setFleetV2(player);
  if (fleet.type !== "Success") return fleet;

  const fleetCurrentSector = await fleet.data.getCurrentSector();

  // 3. set cargo sector
  const starbase = await setStarbaseV2(fleet.data);
  if (starbase.type !== "Success") return starbase;

  const sector = player.getSageGame().getSectorByCoords(starbase.data.data.sector as SectorCoordinates);
  if (sector.type !== "Success") return sector;

  // 4. set cargo resource allocation
  const resourcesGo = await setResourcesAmountV2(
    "Enter resources to freight in starbase DESTINATION (e.g., Carbon 5000), or press enter to skip:"
  );
  const resourcesBack = await setResourcesAmountV2(
    "Enter resources to freight in CURRENT starbase (ex: Hydrogen 2000). Press enter to skip:"
  );

  const effectiveResourcesGo: InputResourcesForCargo[] = [];
  const effectiveResourcesBack: InputResourcesForCargo[] = [];

  // 5. set fleet movement type (->)
  const movementGo = await setMovementTypeV2()

  const [goRoute, goFuelNeeded] = fleet.data.calculateRouteToSectorAndFuelNeededByMovement(
    movementGo.movement, 
    fleetCurrentSector, 
    sector.data);
  
  // 6. set fleet movement type (<-) 
  const movementBack = await setMovementTypeV2()

  const [backRoute, backFuelNeeded] = fleet.data.calculateRouteToSectorAndFuelNeededByMovement(
    movementGo.movement, 
    sector.data, 
    fleetCurrentSector);
  
  const fuelNeeded = goFuelNeeded + backFuelNeeded + 10000;
  console.log("Fuel needed:", fuelNeeded);

  const fuelTank = await fleet.data.getFuelTank();

  const cargoHold = await fleet.data.getCargoHold();

  // 7. start cargo loop
  for (let i = 0; i < cycles; i++) {
    // 1. load fuel
    if (fuelTank.loadedAmount < fuelNeeded) {
      await actionWrapper(loadCargo, fleet.data, ResourceName.Fuel, CargoPodType.FuelTank, new BN(MAX_AMOUNT));
    }

    // 2. load cargo go
    for (const item of resourcesGo) {
      const loading = await actionWrapper(loadCargo, fleet.data, item.resource, CargoPodType.CargoHold, new BN(item.amount));
      if (loading.type === "Success")
        effectiveResourcesGo.push(item);
    }
    
    // 4. undock from starbase
    await actionWrapper(undockFromStarbase, fleet.data);

    // 5. move to sector (->)
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

    // 6. dock to starbase
    await actionWrapper(dockToStarbase, fleet.data);

    // 7. unload cargo go
    for (const item of effectiveResourcesGo) {
      await actionWrapper(unloadCargo, fleet.data, item.resource, CargoPodType.CargoHold, new BN(item.amount));
    }
    
    // 8. load cargo back
    for (const item of resourcesBack) {
      const loading = await actionWrapper(loadCargo, fleet.data, item.resource, CargoPodType.CargoHold, new BN(item.amount));
      if (loading.type === "Success")
        effectiveResourcesBack.push(item);
    }

    // 9. undock from starbase
    await actionWrapper(undockFromStarbase, fleet.data);

    // 10. move to sector (<-)
    if (movementBack.movement === MovementType.Warp) {
      for (let i = 1; i < backRoute.length; i++) {
        const sectorTo = backRoute[i];
        await actionWrapper(warpToSector, fleet.data, sectorTo, false);
      }   
    }

    if (movementBack.movement === MovementType.Subwarp) {
      const sectorTo = backRoute[i];
      await actionWrapper(subwarpToSector, fleet.data, sectorTo);
    }

    // 11. dock to starbase
    await actionWrapper(dockToStarbase, fleet.data);

    // 12. unload cargo back
    for (const item of effectiveResourcesBack) {
      await actionWrapper(unloadCargo, fleet.data, item.resource, CargoPodType.CargoHold, new BN(item.amount));
    }

    // 13. send notification
    await sendNotification(NotificationMessage.CARGO_SUCCESS, fleet.data.getName());
  }

  return { type: "Success" as const };
};
