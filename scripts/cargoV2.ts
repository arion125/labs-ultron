import { dockToStarbase } from "../actions/dockToStarbase";
import { loadCargo } from "../actions/loadCargo";
import { subwarpToSector } from "../actions/subwarpToSector";
import { undockFromStarbase } from "../actions/undockFromStarbase";
import { unloadCargo } from "../actions/unloadCargo";
import { warpToSector } from "../actions/warpToSector";
import { MovementType } from "../common/constants";
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
import { createWarpRoute } from "../utils/movementsV2/createWarpRoute";
import { setResourcesAmountV2 } from "../utils/inputsV2/setResourcesAmount";

export const cargoV2 = async (
  player: SagePlayer,
) => {
  // 1. set cycles
  const cycles = await setCycles();

  // 2. set fleet
  const fleet = await setFleetV2(player);
  if (fleet.type !== "Success") return fleet;

  const currentSector = await fleet.data.getCurrentSectorAsync();
  if (currentSector.type !== "Success") return currentSector;

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
  // const sectorsDistanceGo = fleet.data.getSageGame().calculateDistanceBySector(currentSector.data, sector.data);

  const movementGo = await setMovementTypeV2()

  // calc (route) and fuel needed
  const goRoute = 
    movementGo.movement === MovementType.Warp ? 
      createWarpRoute(fleet.data, currentSector.data, sector.data) :
    movementGo.movement === MovementType.Subwarp ?
      { type: "Success" as const, data: [currentSector.data, sector.data] } : { type: "BrokenRoute" as const } 
  
  if (goRoute.type === "BrokenRoute") return goRoute;

  const goFuelNeeded = movementGo.movement === MovementType.Warp ? 
    (() => { // WARP
      return goRoute.data.reduce((fuelNeeded, currentSector, i, sectors) => {
        if (i === sectors.length - 1) return fuelNeeded;
        const nextSector = sectors[i + 1];
        const sectorsDistanceGo = fleet.data.getSageGame().calculateDistanceBySector(currentSector, nextSector);
        return fuelNeeded + fleet.data.calculateWarpFuelBurnWithDistance(sectorsDistanceGo);
      }, 0)
    })() : movementGo.movement === MovementType.Subwarp ? 
    (() => { // SUBWARP
      const sectorsDistanceGo = fleet.data.getSageGame().calculateDistanceBySector(goRoute.data[0], goRoute.data[1]);
      return fleet.data.calculateSubwarpFuelBurnWithDistance(sectorsDistanceGo);
    })() : 0;
  
  // 6. set fleet movement type (<-)
  // const sectorsDistanceBack = fleet.data.getSageGame().calculateDistanceBySector(sector.data, currentSector.data);
  
  const movementBack = await setMovementTypeV2()

  // calc (route) and fuel needed
  const backRoute = 
    movementBack.movement === MovementType.Warp ? 
      createWarpRoute(fleet.data, sector.data, currentSector.data) :
      movementBack.movement === MovementType.Subwarp ?
      { type: "Success" as const, data: [sector.data, currentSector.data] } : { type: "BrokenRoute" as const } 
  
  if (backRoute.type === "BrokenRoute") return backRoute;

  const backFuelNeeded = movementBack.movement === MovementType.Warp ? 
    (() => { // WARP
      return backRoute.data.reduce((fuelNeeded, currentSector, i, sectors) => {
        if (i === sectors.length - 1) return fuelNeeded;
        const nextSector = sectors[i + 1];
        const sectorsDistanceBack = fleet.data.getSageGame().calculateDistanceBySector(currentSector, nextSector);
        return fuelNeeded + fleet.data.calculateWarpFuelBurnWithDistance(sectorsDistanceBack);
      }, 0)
    })() : movementGo.movement === MovementType.Subwarp ? 
    (() => { // SUBWARP
      const sectorsDistanceBack = fleet.data.getSageGame().calculateDistanceBySector(backRoute.data[0], backRoute.data[1]);
      return fleet.data.calculateSubwarpFuelBurnWithDistance(sectorsDistanceBack);
    })() : 0;
  
  const fuelNeeded = goFuelNeeded + backFuelNeeded;
  console.log("Fuel needed:", fuelNeeded);

  const fuelTank = await fleet.data.getCurrentCargoDataByType(CargoPodType.FuelTank);
      if (fuelTank.type !== "Success" && fuelTank.type !== "CargoPodIsEmpty") return fuelTank; 

  const cargoPod = await fleet.data.getCurrentCargoDataByType(CargoPodType.CargoHold);
    if (cargoPod.type !== "Success" && cargoPod.type !== "CargoPodIsEmpty") return cargoPod;

  // 7. start cargo loop
  for (let i = 0; i < cycles; i++) {
    // 1. load fuel
    if (fuelTank.data.loadedAmount < fuelNeeded) {
      await actionWrapper(loadCargo, fleet.data, ResourceName.Fuel, CargoPodType.FuelTank, new BN(fuelNeeded - fuelTank.data.loadedAmount));
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
      for (let i = 0; i < goRoute.data.length; i++) {
        const sectorTo = goRoute.data[i];
        await actionWrapper(warpToSector, fleet.data, sectorTo, false);
      }   
    }

    if (movementGo.movement === MovementType.Subwarp) {
      const sectorTo = goRoute.data[1];
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
      for (let i = 0; i < backRoute.data.length; i++) {
        const sectorTo = backRoute.data[i];
        await actionWrapper(warpToSector, fleet.data, sectorTo, true);
      }   
    }

    if (movementBack.movement === MovementType.Subwarp) {
      const sectorTo = backRoute.data[i];
      await actionWrapper(subwarpToSector, fleet.data, sectorTo);
    }

    // 11. dock to starbase
    await actionWrapper(dockToStarbase, fleet.data);

    // 12. unload cargo back
    for (const item of effectiveResourcesBack) {
      await actionWrapper(unloadCargo, fleet.data, item.resource, CargoPodType.CargoHold, new BN(item.amount));
    }

    // 13. send notification
    await sendNotification(NotificationMessage.CARGO_SUCCESS, fleet.data.name);
  }

  return { type: "Success" as const };
};