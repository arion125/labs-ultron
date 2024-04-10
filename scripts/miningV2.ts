import { dockToStarbase } from "../actions/dockToStarbase";
import { loadCargo } from "../actions/loadCargo";
import { startMining } from "../actions/startMining";
import { stopMining } from "../actions/stopMining";
import { subwarpToSector } from "../actions/subwarpToSector";
import { undockFromStarbase } from "../actions/undockFromStarbase";
import { unloadCargo } from "../actions/unloadCargo";
import { warpToSector } from "../actions/warpToSector";
import { MAX_AMOUNT, MovementType } from "../common/constants";
import { NotificationMessage } from "../common/notifications";
import { SectorCoordinates } from "../common/types";
import { actionWrapper } from "../utils/actions/actionWrapper";
import { sendNotification } from "../utils/actions/sendNotification";
import { SagePlayer } from "../src/SagePlayer";
import { setFleetV2 } from "../utils/inputsV2/setFleet";
import { setCycles } from "../utils/inputs/setCycles";
import { setStarbaseV2 } from "../utils/inputsV2/setStarbase";
import { setResourceToMine } from "../utils/inputsV2/setResourceToMine";
import { setMovementTypeV2 } from "../utils/inputsV2/setMovementType";
import { BN } from "@staratlas/anchor";
import { ResourceName } from "../src/SageGame";
import { CargoPodType } from "../src/SageFleet";
import { createWarpRoute } from "../utils/movementsV2/createWarpRoute";

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

  const resourcToMineName = fleet.data.getSageGame().getResourcesMintNameByMint(resourceToMine.data.mineItem.data.mint);
  if (resourcToMineName.type !== "Success") return resourcToMineName;

  // calc fuel, ammo and food needed
  const miningSessionData = fleet.data.getTimeAndNeededResourcesToFullCargoInMining(resourceToMine.data);

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
  
  const fuelNeeded = miningSessionData.fuelNeeded + goFuelNeeded + backFuelNeeded;
  console.log("Fuel needed:", fuelNeeded);

  const fuelTank = await fleet.data.getCurrentCargoDataByType(CargoPodType.FuelTank);
      if (fuelTank.type !== "Success" && fuelTank.type !== "CargoPodIsEmpty") return fuelTank; 

  const ammoBank = await fleet.data.getCurrentCargoDataByType(CargoPodType.AmmoBank);
    if (ammoBank.type !== "Success" && ammoBank.type !== "CargoPodIsEmpty") return ammoBank;

  const cargoPod = await fleet.data.getCurrentCargoDataByType(CargoPodType.CargoHold);
    if (cargoPod.type !== "Success" && cargoPod.type !== "CargoPodIsEmpty") return cargoPod;
  const [foodInCargoData] = cargoPod.data.loadedResources.filter((item) => item.mint.equals(fleet.data.getSageGame().getResourcesMint().Food));

  // 7. start mining loop
  for (let i = 0; i < cycles; i++) {
    // 1. load fuel
    if (fuelTank.data.loadedAmount < fuelNeeded) {
      await actionWrapper(loadCargo, fleet.data, ResourceName.Fuel, CargoPodType.FuelTank, new BN(fuelNeeded - fuelTank.data.loadedAmount));
    }

    // 2. load ammo
    if (ammoBank.data.loadedAmount < miningSessionData.ammoNeeded) {
      await actionWrapper(loadCargo, fleet.data, ResourceName.Ammo, CargoPodType.AmmoBank, new BN(miningSessionData.ammoNeeded - ammoBank.data.loadedAmount));
    }

    // 3. load food
    if (foodInCargoData) {
      if (Number(foodInCargoData.tokenAccount.amount || 0) < miningSessionData.foodNeeded) {
        await actionWrapper(loadCargo, fleet.data, ResourceName.Food, CargoPodType.CargoHold, new BN(miningSessionData.foodNeeded - Number(foodInCargoData.tokenAccount.amount || 0)));
      }
    } else {
      await actionWrapper(loadCargo, fleet.data, ResourceName.Food, CargoPodType.CargoHold, new BN(miningSessionData.foodNeeded));
    }
    
    // 4. undock from starbase
    await actionWrapper(undockFromStarbase, fleet.data);

    // 5. move to sector (->)
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

    // 6. start mining
    await actionWrapper(startMining, fleet.data, resourcToMineName.data, miningSessionData.timeInSeconds);

    // 7. stop mining
    await actionWrapper(stopMining, fleet.data, resourcToMineName.data);

    // 8. move to sector (<-)
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

    // 9. dock to starbase
    await actionWrapper(dockToStarbase, fleet.data);

    // 10. unload cargo
    await actionWrapper(unloadCargo, fleet.data, resourcToMineName.data, CargoPodType.CargoHold, new BN(MAX_AMOUNT));

    // 11. unload food
    // await actionWrapper(unloadCargo, fleet.data, ResourceName.Food, CargoPodType.CargoHold, new BN(MAX_AMOUNT));

    // 12. send notification
    await sendNotification(NotificationMessage.MINING_SUCCESS, fleet.data.getName());
  }

  return { type: "Success" as const };
};
