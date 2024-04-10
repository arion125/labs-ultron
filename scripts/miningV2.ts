import { byteArrayToString } from "@staratlas/data-source";
import { Fleet } from "@staratlas/sage";
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

  // calc fuel, ammo and food needed
  const miningSessionData = fleet.data.getTimeAndNeededResourcesToFullCargoInMining(resourceToMine.data);

  // 5. set fleet movement type (->)
  // const sectorsDistanceGo = fleet.data.getSageGame().calculateDistanceBySector(currentSector.data, sector.data);

  const movementGo = await setMovementTypeV2()

  // calc (route) and fuel needed
  const goWarpRoute = movementGo.movement === MovementType.Warp ? 
    createWarpRoute(fleet.data, currentSector.data, sector.data): { type: "NoWarpMovement" as const, data: [] }
  if (goWarpRoute.type === "BrokenWarpRoute") return goWarpRoute;

  const goFuelNeeded = movementGo.movement === MovementType.Warp ? 
    (() => { // WARP
      return goWarpRoute.data.reduce((fuelNeeded, currentSector, i, sectors) => {
        if (i === sectors.length - 1) return fuelNeeded;
        const nextSector = sectors[i + 1];
        const sectorsDistanceGo = fleet.data.getSageGame().calculateDistanceBySector(currentSector, nextSector);
        return fuelNeeded + fleet.data.calculateWarpFuelBurnWithDistance(sectorsDistanceGo);
      }, 0)
    })() : 
    (() => { // SUBWARP
      const sectorsDistanceGo = fleet.data.getSageGame().calculateDistanceBySector(currentSector.data, sector.data);
      return fleet.data.calculateSubwarpFuelBurnWithDistance(sectorsDistanceGo);
    })()
  
  // 6. set fleet movement type (<-)
  // const sectorsDistanceBack = fleet.data.getSageGame().calculateDistanceBySector(sector.data, currentSector.data);
  
  const movementBack = await setMovementTypeV2()

  // calc (route) and fuel needed
  const backWarpRoute = movementBack.movement === MovementType.Warp ? 
    createWarpRoute(fleet.data, sector.data, currentSector.data): { type: "NoWarpMovement" as const, data: [] }
  if (backWarpRoute.type === "BrokenWarpRoute") return backWarpRoute;

  const backFuelNeeded = movementBack.movement === MovementType.Warp ? 
    (() => { // WARP
      return backWarpRoute.data.reduce((fuelNeeded, currentSector, i, sectors) => {
        if (i === sectors.length - 1) return fuelNeeded;
        const nextSector = sectors[i + 1];
        const sectorsDistanceBack = fleet.data.getSageGame().calculateDistanceBySector(currentSector, nextSector);
        return fuelNeeded + fleet.data.calculateWarpFuelBurnWithDistance(sectorsDistanceBack);
      }, 0)
    })() : 
    (() => { // SUBWARP
      const sectorsDistanceBack = fleet.data.getSageGame().calculateDistanceBySector(sector.data, currentSector.data);
      return fleet.data.calculateSubwarpFuelBurnWithDistance(sectorsDistanceBack);
    })()
  
  // 7. start mining loop
  for (let i = 0; i < cycles; i++) {
    // 1. load fuel
    // await actionWrapper(loadCargo, fleet.data, ResourceName.Fuel, CargoPodType.FuelTank, new BN(miningSessionData.fuelNeeded + goFuelNeeded + backFuelNeeded));

    // 2. load ammo
    // await actionWrapper(loadCargo, fleet.data, ResourceName.Ammo, CargoPodType.AmmoBank, new BN(miningSessionData.ammoNeeded));

    // 3. load food
    // await actionWrapper(loadCargo, fleet.data, ResourceName.Food, CargoPodType.CargoHold, new BN(miningSessionData.foodNeeded));
    
    // 4. undock from starbase
    // await actionWrapper(undockFromStarbase, fleet.data);

    // 5. move to sector (->)
    if (movementGo.movement === MovementType.Warp && goWarpRoute.type === "Success") {
      for (let i = 0; i < goWarpRoute.data.length; i++) {
        const sector = goWarpRoute.data[i];
        await actionWrapper(warpToSector, fleet.data, sector, false);
      }   
    }

    if (movementGo.movement === MovementType.Subwarp) {
      await actionWrapper(subwarpToSector, fleet.data, sector.data);
    }

    // 6. start mining
    await actionWrapper(startMining, fleet.data, ResourceName.Hydrogen, miningSessionData.timeInSeconds);

    // 7. stop mining
    await actionWrapper(stopMining, fleet.data, ResourceName.Hydrogen);

    // 8. move to sector (<-)

    // 9. dock to starbase
    await actionWrapper(dockToStarbase, fleet.data);

    // 10. unload cargo
    await actionWrapper(unloadCargo, fleet.data, ResourceName.Hydrogen, CargoPodType.CargoHold, new BN(999_999));

    // 11. unload food
  }

  return { type: "Success" as const };
};
