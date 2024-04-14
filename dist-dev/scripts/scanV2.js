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
exports.scanV2 = void 0;
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
const setMovementType_1 = require("../utils/inputsV2/setMovementType");
const anchor_1 = require("@staratlas/anchor");
const SageGame_1 = require("../src/SageGame");
const SageFleet_1 = require("../src/SageFleet");
const setScanCoordinates_1 = require("../utils/inputsV2/setScanCoordinates");
const scanSdu_1 = require("../actions/scanSdu");
const scanV2 = (player) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. set cycles
    const cycles = yield (0, setCycles_1.setCycles)();
    // 2. set fleet
    const fleet = yield (0, setFleet_1.setFleetV2)(player);
    if (fleet.type !== "Success")
        return fleet;
    const fleetCurrentSector = yield fleet.data.getCurrentSector();
    // 3. set sector coords
    const coords = yield (0, setScanCoordinates_1.setScanCoordinates)();
    if (coords.type !== "Success")
        return coords;
    const sector = yield player.getSageGame().getSectorByCoordsAsync(coords.data);
    if (sector.type !== "Success")
        return sector;
    const isSameSector = fleetCurrentSector.key.equals(sector.data.key);
    let movementGo, movementBack;
    if (!isSameSector) {
        // 4. set fleet movement type (->)
        movementGo = yield (0, setMovementType_1.setMovementTypeV2)();
        // 5. set fleet movement type (<-) 
        movementBack = yield (0, setMovementType_1.setMovementTypeV2)();
    }
    // 4 & 5. calculate routes and fuel needed
    const [goRoute, goFuelNeeded] = fleet.data.calculateRouteToSector(fleetCurrentSector, sector.data, movementGo === null || movementGo === void 0 ? void 0 : movementGo.movement);
    const [backRoute, backFuelNeeded] = fleet.data.calculateRouteToSector(sector.data, fleetCurrentSector, movementBack === null || movementBack === void 0 ? void 0 : movementBack.movement);
    const fuelNeeded = goFuelNeeded + backFuelNeeded + 10000;
    // console.log("Fuel needed:", fuelNeeded);
    const fuelTank = fleet.data.getFuelTank();
    // 6. start scan loop
    for (let i = 0; i < cycles; i++) {
        // 1. load fuel
        if (fuelTank.loadedAmount.lt(new anchor_1.BN(fuelNeeded))) {
            yield (0, actionWrapper_1.actionWrapper)(loadCargo_1.loadCargo, fleet.data, SageGame_1.ResourceName.Fuel, SageFleet_1.CargoPodType.FuelTank, new anchor_1.BN(constants_1.MAX_AMOUNT));
        }
        // 2. load food
        if (!fleet.data.getOnlyDataRunner()) {
            yield (0, actionWrapper_1.actionWrapper)(loadCargo_1.loadCargo, fleet.data, SageGame_1.ResourceName.Food, SageFleet_1.CargoPodType.CargoHold, new anchor_1.BN(constants_1.MAX_AMOUNT));
        }
        // 3. undock from starbase
        yield (0, actionWrapper_1.actionWrapper)(undockFromStarbase_1.undockFromStarbase, fleet.data);
        // 4. move to sector (->)
        if (!isSameSector && movementGo && movementGo.movement === constants_1.MovementType.Warp) {
            for (let i = 1; i < goRoute.length; i++) {
                const sectorTo = goRoute[i];
                const warp = yield (0, actionWrapper_1.actionWrapper)(warpToSector_1.warpToSector, fleet.data, sectorTo, goFuelNeeded, false);
                if (warp.type !== "Success") {
                    return warp;
                }
            }
        }
        if (!isSameSector && movementGo && movementGo.movement === constants_1.MovementType.Subwarp) {
            const sectorTo = goRoute[1];
            const subwarp = yield (0, actionWrapper_1.actionWrapper)(subwarpToSector_1.subwarpToSector, fleet.data, sectorTo, goFuelNeeded);
            if (subwarp.type !== "Success") {
                return subwarp;
            }
        }
        // 6. scan sector
        for (let i = 1; i < 10; i++) {
            const scan = yield (0, actionWrapper_1.actionWrapper)(scanSdu_1.scanSdu, fleet.data, i);
            if (scan.type !== "Success")
                break;
        }
        // 10. move to sector (<-)
        if (!isSameSector && movementBack && movementBack.movement === constants_1.MovementType.Warp) {
            for (let i = 1; i < backRoute.length; i++) {
                const sectorTo = backRoute[i];
                const warp = yield (0, actionWrapper_1.actionWrapper)(warpToSector_1.warpToSector, fleet.data, sectorTo, backFuelNeeded, true);
                if (warp.type !== "Success") {
                    return warp;
                }
            }
        }
        if (!isSameSector && movementBack && movementBack.movement === constants_1.MovementType.Subwarp) {
            const sectorTo = backRoute[i];
            const subwarp = yield (0, actionWrapper_1.actionWrapper)(subwarpToSector_1.subwarpToSector, fleet.data, sectorTo, backFuelNeeded);
            if (subwarp.type !== "Success") {
                return subwarp;
            }
        }
        // 11. dock to starbase
        yield (0, actionWrapper_1.actionWrapper)(dockToStarbase_1.dockToStarbase, fleet.data);
        // 12. unload cargo
        yield (0, actionWrapper_1.actionWrapper)(unloadCargo_1.unloadCargo, fleet.data, SageGame_1.ResourceName.Sdu, SageFleet_1.CargoPodType.CargoHold, new anchor_1.BN(constants_1.MAX_AMOUNT));
        if (!fleet.data.getOnlyDataRunner()) {
            yield (0, actionWrapper_1.actionWrapper)(unloadCargo_1.unloadCargo, fleet.data, SageGame_1.ResourceName.Food, SageFleet_1.CargoPodType.CargoHold, new anchor_1.BN(constants_1.MAX_AMOUNT));
        }
        // 13. send notification
        yield (0, sendNotification_1.sendNotification)(notifications_1.NotificationMessage.SCAN_SUCCESS, fleet.data.getName());
    }
    return { type: "Success" };
});
exports.scanV2 = scanV2;
