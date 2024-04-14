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
exports.cargoV2 = void 0;
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
const cargoV2 = (player) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. set cycles
    const cycles = yield (0, setCycles_1.setCycles)();
    // 2. set fleet
    const fleet = yield (0, setFleet_1.setFleetV2)(player);
    if (fleet.type !== "Success")
        return fleet;
    const fleetCurrentSector = yield fleet.data.getCurrentSector();
    // 3. set cargo sector
    const starbase = yield (0, setStarbase_1.setStarbaseV2)(fleet.data, true);
    if (starbase.type !== "Success")
        return starbase;
    const sector = player.getSageGame().getSectorByCoords(starbase.data.data.sector);
    if (sector.type !== "Success")
        return sector;
    // 4. set cargo resource allocation
    const resourcesGo = yield (0, setResourcesAmount_1.setResourcesAmountV2)("Enter resources to freight in starbase DESTINATION (e.g., Carbon 5000), or press enter to skip:");
    const resourcesBack = yield (0, setResourcesAmount_1.setResourcesAmountV2)("Enter resources to freight in CURRENT starbase (ex: Hydrogen 2000). Press enter to skip:");
    const effectiveResourcesGo = [];
    const effectiveResourcesBack = [];
    // 5. set fleet movement type (->)
    const movementGo = yield (0, setMovementType_1.setMovementTypeV2)();
    const [goRoute, goFuelNeeded] = fleet.data.calculateRouteToSector(fleetCurrentSector, sector.data, movementGo.movement);
    // 6. set fleet movement type (<-) 
    const movementBack = yield (0, setMovementType_1.setMovementTypeV2)();
    const [backRoute, backFuelNeeded] = fleet.data.calculateRouteToSector(sector.data, fleetCurrentSector, movementBack.movement);
    const fuelNeeded = goFuelNeeded + backFuelNeeded + 10000;
    // console.log("Fuel needed:", fuelNeeded);
    const fuelTank = yield fleet.data.getFuelTank();
    // 7. start cargo loop
    for (let i = 0; i < cycles; i++) {
        // 0. Dock to starbase (optional)
        if (!fleet.data.getCurrentState().StarbaseLoadingBay &&
            fleet.data.getSageGame().getStarbaseBySector(fleetCurrentSector).type === "Success") {
            yield (0, actionWrapper_1.actionWrapper)(dockToStarbase_1.dockToStarbase, fleet.data);
        }
        else if (!fleet.data.getCurrentState().StarbaseLoadingBay &&
            fleet.data.getSageGame().getStarbaseBySector(fleetCurrentSector).type !== "Success") {
            return fleet.data.getSageGame().getStarbaseBySector(fleetCurrentSector);
        }
        // 1. load fuel
        if (fuelTank.loadedAmount.lt(new anchor_1.BN(fuelNeeded))) {
            yield (0, actionWrapper_1.actionWrapper)(loadCargo_1.loadCargo, fleet.data, SageGame_1.ResourceName.Fuel, SageFleet_1.CargoPodType.FuelTank, new anchor_1.BN(constants_1.MAX_AMOUNT));
        }
        // 2. load cargo go
        for (const item of resourcesGo) {
            const loading = yield (0, actionWrapper_1.actionWrapper)(loadCargo_1.loadCargo, fleet.data, item.resource, SageFleet_1.CargoPodType.CargoHold, new anchor_1.BN(item.amount));
            if (loading.type === "Success")
                effectiveResourcesGo.push(item);
        }
        // 4. undock from starbase
        yield (0, actionWrapper_1.actionWrapper)(undockFromStarbase_1.undockFromStarbase, fleet.data);
        // 5. move to sector (->)
        if (movementGo && movementGo.movement === constants_1.MovementType.Warp) {
            for (let i = 1; i < goRoute.length; i++) {
                const sectorTo = goRoute[i];
                const warp = yield (0, actionWrapper_1.actionWrapper)(warpToSector_1.warpToSector, fleet.data, sectorTo, goFuelNeeded, false);
                if (warp.type !== "Success") {
                    yield (0, actionWrapper_1.actionWrapper)(dockToStarbase_1.dockToStarbase, fleet.data);
                    return warp;
                }
            }
        }
        if (movementGo && movementGo.movement === constants_1.MovementType.Subwarp) {
            const sectorTo = goRoute[1];
            const subwarp = yield (0, actionWrapper_1.actionWrapper)(subwarpToSector_1.subwarpToSector, fleet.data, sectorTo, goFuelNeeded);
            if (subwarp.type !== "Success") {
                yield (0, actionWrapper_1.actionWrapper)(dockToStarbase_1.dockToStarbase, fleet.data);
                return subwarp;
            }
        }
        // 6. dock to starbase
        yield (0, actionWrapper_1.actionWrapper)(dockToStarbase_1.dockToStarbase, fleet.data);
        // 7. unload cargo go
        for (const item of effectiveResourcesGo) {
            yield (0, actionWrapper_1.actionWrapper)(unloadCargo_1.unloadCargo, fleet.data, item.resource, SageFleet_1.CargoPodType.CargoHold, new anchor_1.BN(item.amount));
        }
        // 8. load cargo back
        for (const item of resourcesBack) {
            const loading = yield (0, actionWrapper_1.actionWrapper)(loadCargo_1.loadCargo, fleet.data, item.resource, SageFleet_1.CargoPodType.CargoHold, new anchor_1.BN(item.amount));
            if (loading.type === "Success")
                effectiveResourcesBack.push(item);
        }
        // 9. undock from starbase
        yield (0, actionWrapper_1.actionWrapper)(undockFromStarbase_1.undockFromStarbase, fleet.data);
        // 10. move to sector (<-)
        if (movementBack && movementBack.movement === constants_1.MovementType.Warp) {
            for (let i = 1; i < backRoute.length; i++) {
                const sectorTo = backRoute[i];
                const warp = yield (0, actionWrapper_1.actionWrapper)(warpToSector_1.warpToSector, fleet.data, sectorTo, backFuelNeeded, true);
                if (warp.type !== "Success") {
                    yield (0, actionWrapper_1.actionWrapper)(dockToStarbase_1.dockToStarbase, fleet.data);
                    return warp;
                }
            }
        }
        if (movementBack && movementBack.movement === constants_1.MovementType.Subwarp) {
            const sectorTo = backRoute[i];
            const subwarp = yield (0, actionWrapper_1.actionWrapper)(subwarpToSector_1.subwarpToSector, fleet.data, sectorTo, backFuelNeeded);
            if (subwarp.type !== "Success") {
                yield (0, actionWrapper_1.actionWrapper)(dockToStarbase_1.dockToStarbase, fleet.data);
                return subwarp;
            }
        }
        // 11. dock to starbase
        yield (0, actionWrapper_1.actionWrapper)(dockToStarbase_1.dockToStarbase, fleet.data);
        // 12. unload cargo back
        for (const item of effectiveResourcesBack) {
            yield (0, actionWrapper_1.actionWrapper)(unloadCargo_1.unloadCargo, fleet.data, item.resource, SageFleet_1.CargoPodType.CargoHold, new anchor_1.BN(item.amount));
        }
        // 13. send notification
        yield (0, sendNotification_1.sendNotification)(notifications_1.NotificationMessage.CARGO_SUCCESS, fleet.data.getName());
    }
    return { type: "Success" };
});
exports.cargoV2 = cargoV2;
