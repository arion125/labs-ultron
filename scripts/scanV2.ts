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
import { createWarpRoute } from "../utils/movementsV2/createWarpRoute";
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

  const currentSector = await fleet.data.getCurrentSectorAsync();
  if (currentSector.type !== "Success") return currentSector;

  // 3. set sector coords
  const coords = await setScanCoordinates();
  if (coords.type !== "Success") return coords;

  const sector = await player.getSageGame().getSectorByCoordsAsync(coords.data);
  if (sector.type !== "Success") return sector;

  // 4. set fleet movement type (->)
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
  
  const fuelNeeded = goFuelNeeded + backFuelNeeded + 10000;
  console.log("Fuel needed:", fuelNeeded);

  const fuelTank = await fleet.data.getCurrentCargoDataByType(CargoPodType.FuelTank);
      if (fuelTank.type !== "Success" && fuelTank.type !== "CargoPodIsEmpty") return fuelTank; 

  const cargoPod = await fleet.data.getCurrentCargoDataByType(CargoPodType.CargoHold);
    if (cargoPod.type !== "Success" && cargoPod.type !== "CargoPodIsEmpty") return cargoPod;

  // 7. start scan loop
  for (let i = 0; i < cycles; i++) {
    // 1. load fuel
    if (fuelTank.data.loadedAmount < fuelNeeded) {
      await actionWrapper(loadCargo, fleet.data, ResourceName.Fuel, CargoPodType.FuelTank, new BN(fuelNeeded - fuelTank.data.loadedAmount));
    }

    // 2. load tools
    if (!fleet.data.getOnlyDataRunner()) {
      await actionWrapper(loadCargo, fleet.data, ResourceName.Tool, CargoPodType.CargoHold, new BN(MAX_AMOUNT));
    }
    
    // 3. undock from starbase
    await actionWrapper(undockFromStarbase, fleet.data);

    // 4. move to sector (->)
    if (movementGo.movement === MovementType.Warp) {
      for (let i = 1; i < goRoute.data.length; i++) {
        const sectorTo = goRoute.data[i];
        await actionWrapper(warpToSector, fleet.data, sectorTo, false);
      }   
    }

    if (movementGo.movement === MovementType.Subwarp) {
      const sectorTo = goRoute.data[1];
      await actionWrapper(subwarpToSector, fleet.data, sectorTo);
    }

    // 6. scan sector
    for (let i = 1; i < MAX_AMOUNT; i++) {
      const scan = await actionWrapper(scanSdu, fleet.data, i);
      if (scan.type !== "Success") break;
    }

    // 10. move to sector (<-)
    if (movementBack.movement === MovementType.Warp) {
      for (let i = 1; i < backRoute.data.length; i++) {
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
