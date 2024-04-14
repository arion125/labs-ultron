"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cargoMiningV2 = void 0;
const dockToStarbase_1 = require("../actions/dockToStarbase");
const loadCargo_1 = require("../actions/loadCargo");
const subwarpToSector_1 = require("../actions/subwarpToSector");
const undockFromStarbase_1 = require("../actions/undockFromStarbase");
const unloadCargo_1 = require("../actions/unloadCargo");
const warpToSector_1 = require("../actions/warpToSector");
const constants_1 = require("../common/constants");
const notifications_1 = require("../common/notifications");
const actionWrapper_1 = require("../utils/actions/actionWrapper");
const sendNotification_1 = require("../utils/actions/sendNotification");
const setFleet_1 = require("../utils/inputsV2/setFleet");
const setCycles_1 = require("../utils/inputs/setCycles");
const setStarbase_1 = require("../utils/inputsV2/setStarbase");
const setMovementType_1 = require("../utils/inputsV2/setMovementType");
const anchor_1 = require("@staratlas/anchor");
const SageGame_1 = require("../src/SageGame");
const SageFleet_1 = require("../src/SageFleet");
const setResourcesAmount_1 = require("../utils/inputsV2/setResourcesAmount");
const setResourceToMine_1 = require("../utils/inputsV2/setResourceToMine");
const startMining_1 = require("../actions/startMining");
const stopMining_1 = require("../actions/stopMining");
const cargoMiningV2 = (player) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. set cycles
    const cycles = yield (0, setCycles_1.setCycles)();
    // 2. set fleet
    const fleet = yield (0, setFleet_1.setFleetV2)(player);
    if (fleet.type !== "Success")
        return fleet;
    const fleetCurrentSector = yield fleet.data.getCurrentSector();
    // 3. set cargo and mining sector
    const starbase = yield (0, setStarbase_1.setStarbaseV2)(fleet.data);
    if (starbase.type !== "Success")
        return starbase;
    const sector = player.getSageGame().getSectorByCoords(starbase.data.data.sector);
    if (sector.type !== "Success")
        return sector;
    const isSameSector = fleetCurrentSector.key.equals(sector.data.key);
    // 4. set cargo resource allocation
    const resourcesGo = yield (0, setResourcesAmount_1.setResourcesAmountV2)("Enter resources to freight in starbase DESTINATION (e.g., Carbon 5000), or press enter to skip:");
    const effectiveResourcesGo = [];
    // 5. set mining resource
    const resourceToMine = yield (0, setResourceToMine_1.setResourceToMine)(fleet.data, sector.data);
    if (resourceToMine.type !== "Success")
        return resourceToMine;
    const resourceToMineName = fleet.data.getSageGame().getResourcesMintNameByMint(resourceToMine.data.mineItem.data.mint);
    if (resourceToMineName.type !== "Success")
        return resourceToMineName;
    // calc fuel, ammo and food needed
    const miningSessionData = fleet.data.getTimeAndNeededResourcesToFullCargoInMining(resourceToMine.data);
    let movementGo, movementBack;
    if (!isSameSector) {
        // 6. set fleet movement type (->)
        movementGo = yield (0, setMovementType_1.setMovementTypeV2)();
        // 7. set fleet movement type (<-) 
        movementBack = yield (0, setMovementType_1.setMovementTypeV2)();
    }
    // 6 & 7. calculate routes and fuel needed
    const [goRoute, goFuelNeeded] = fleet.data.calculateRouteToSector(fleetCurrentSector, sector.data, movementGo === null || movementGo === void 0 ? void 0 : movementGo.movement);
    const [backRoute, backFuelNeeded] = fleet.data.calculateRouteToSector(sector.data, fleetCurrentSector, movementBack === null || movementBack === void 0 ? void 0 : movementBack.movement);
    const fuelNeeded = miningSessionData.fuelNeeded + goFuelNeeded + backFuelNeeded + 10000;
    // console.log("Fuel needed:", fuelNeeded);
    const fuelTank = fleet.data.getFuelTank();
    const ammoBank = fleet.data.getAmmoBank();
    const cargoHold = fleet.data.getCargoHold();
    const [foodInCargoData] = cargoHold.resources.filter((item) => item.mint.equals(fleet.data.getSageGame().getResourcesMint().Food));
    // 8. start cargo mining loop
    for (let i = 0; i < cycles; i++) {
        // 1. load fuel
        if (fuelTank.loadedAmount.lt(new anchor_1.BN(fuelNeeded))) {
            yield (0, actionWrapper_1.actionWrapper)(loadCargo_1.loadCargo, fleet.data, SageGame_1.ResourceName.Fuel, SageFleet_1.CargoPodType.FuelTank, new anchor_1.BN(constants_1.MAX_AMOUNT));
        }
        // 2. load ammo
        if (ammoBank.loadedAmount.lt(new anchor_1.BN(miningSessionData.ammoNeeded))) {
            yield (0, actionWrapper_1.actionWrapper)(loadCargo_1.loadCargo, fleet.data, SageGame_1.ResourceName.Ammo, SageFleet_1.CargoPodType.AmmoBank, new anchor_1.BN(constants_1.MAX_AMOUNT));
        }
        // 3. load food
        if (foodInCargoData) {
            if (Number(foodInCargoData.amount || 0) < miningSessionData.foodNeeded) {
                yield (0, actionWrapper_1.actionWrapper)(loadCargo_1.loadCargo, fleet.data, SageGame_1.ResourceName.Food, SageFleet_1.CargoPodType.CargoHold, new anchor_1.BN(miningSessionData.foodNeeded - Number(foodInCargoData.amount || 0)));
            }
        }
        else {
            yield (0, actionWrapper_1.actionWrapper)(loadCargo_1.loadCargo, fleet.data, SageGame_1.ResourceName.Food, SageFleet_1.CargoPodType.CargoHold, new anchor_1.BN(miningSessionData.foodNeeded));
        }
        // 4. load cargo go
        for (const item of resourcesGo) {
            const loading = yield (0, actionWrapper_1.actionWrapper)(loadCargo_1.loadCargo, fleet.data, item.resource, SageFleet_1.CargoPodType.CargoHold, new anchor_1.BN(item.amount));
            if (loading.type === "Success")
                effectiveResourcesGo.push(item);
        }
        // 5. undock from starbase
        yield (0, actionWrapper_1.actionWrapper)(undockFromStarbase_1.undockFromStarbase, fleet.data);
        // 6. move to sector (->)
        if (!isSameSector && movementGo && movementGo.movement === constants_1.MovementType.Warp) {
            for (let i = 1; i < goRoute.length; i++) {
                const sectorTo = goRoute[i];
                const warp = yield (0, actionWrapper_1.actionWrapper)(warpToSector_1.warpToSector, fleet.data, sectorTo, goFuelNeeded, false);
                if (warp.type !== "Success") {
                    yield (0, actionWrapper_1.actionWrapper)(dockToStarbase_1.dockToStarbase, fleet.data);
                    return warp;
                }
            }
        }
        if (!isSameSector && movementGo && movementGo.movement === constants_1.MovementType.Subwarp) {
            const sectorTo = goRoute[1];
            const subwarp = yield (0, actionWrapper_1.actionWrapper)(subwarpToSector_1.subwarpToSector, fleet.data, sectorTo, goFuelNeeded);
            if (subwarp.type !== "Success") {
                yield (0, actionWrapper_1.actionWrapper)(dockToStarbase_1.dockToStarbase, fleet.data);
                return subwarp;
            }
        }
        // 7. dock to starbase
        yield (0, actionWrapper_1.actionWrapper)(dockToStarbase_1.dockToStarbase, fleet.data);
        // 8. unload cargo go
        for (const item of effectiveResourcesGo) {
            yield (0, actionWrapper_1.actionWrapper)(unloadCargo_1.unloadCargo, fleet.data, item.resource, SageFleet_1.CargoPodType.CargoHold, new anchor_1.BN(item.amount));
        }
        // 9. undock from starbase
        yield (0, actionWrapper_1.actionWrapper)(undockFromStarbase_1.undockFromStarbase, fleet.data);
        // 10. start mining
        yield (0, actionWrapper_1.actionWrapper)(startMining_1.startMining, fleet.data, resourceToMineName.data, miningSessionData.timeInSeconds);
        // 11. stop mining
        yield (0, actionWrapper_1.actionWrapper)(stopMining_1.stopMining, fleet.data, resourceToMineName.data);
        // 12. move to sector (<-)
        if (!isSameSector && movementBack && movementBack.movement === constants_1.MovementType.Warp) {
            for (let i = 1; i < backRoute.length; i++) {
                const sectorTo = backRoute[i];
                const warp = yield (0, actionWrapper_1.actionWrapper)(warpToSector_1.warpToSector, fleet.data, sectorTo, backFuelNeeded, true);
                if (warp.type !== "Success") {
                    yield (0, actionWrapper_1.actionWrapper)(dockToStarbase_1.dockToStarbase, fleet.data);
                    return warp;
                }
            }
        }
        if (!isSameSector && movementBack && movementBack.movement === constants_1.MovementType.Subwarp) {
            const sectorTo = backRoute[i];
            const subwarp = yield (0, actionWrapper_1.actionWrapper)(subwarpToSector_1.subwarpToSector, fleet.data, sectorTo, backFuelNeeded);
            if (subwarp.type !== "Success") {
                yield (0, actionWrapper_1.actionWrapper)(dockToStarbase_1.dockToStarbase, fleet.data);
                return subwarp;
            }
        }
        // 13. dock to starbase
        yield (0, actionWrapper_1.actionWrapper)(dockToStarbase_1.dockToStarbase, fleet.data);
        // 14. unload cargo back
        yield (0, actionWrapper_1.actionWrapper)(unloadCargo_1.unloadCargo, fleet.data, resourceToMineName.data, SageFleet_1.CargoPodType.CargoHold, new anchor_1.BN(constants_1.MAX_AMOUNT));
        // 15. send notification
        yield (0, sendNotification_1.sendNotification)(notifications_1.NotificationMessage.MINING_CARGO_SUCCESS, fleet.data.getName());
    }
    return { type: "Success" };
});
exports.cargoMiningV2 = cargoMiningV2;
