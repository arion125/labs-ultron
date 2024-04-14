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
exports.warpToSector = void 0;
const wait_1 = require("../utils/actions/wait");
const anchor_1 = require("@staratlas/anchor");
const warpToSector = (fleet, sector, fuelNeeded, waitCooldown) => __awaiter(void 0, void 0, void 0, function* () {
    // action starts
    console.log(`\nStart warp...`);
    // data
    const sectorsDistance = fleet.getSageGame().calculateDistanceBySector(fleet.getCurrentSector(), sector);
    const timeToWarp = fleet.calculateWarpTimeWithDistance(sectorsDistance);
    // instruction
    const ix = yield fleet.ixWarpToSector(sector, new anchor_1.BN(fuelNeeded));
    // issues and errors handling
    switch (ix.type) {
        // issues that lead to the next action of the main script or the end of the script
        case "NoEnoughFuelToWarp":
            return ix;
        // blocking errors or failures that require retrying the entire action
        default:
            if (ix.type !== "Success")
                throw new Error(ix.type); // retry entire action
    }
    // build and send transactions
    const sdt = yield fleet.getSageGame().buildAndSendDynamicTransactions(ix.ixs, false);
    if (sdt.type !== "Success")
        throw new Error(sdt.type); // retry entire action
    // other
    console.log(`Waiting for ${timeToWarp} seconds...`);
    yield (0, wait_1.wait)(timeToWarp);
    console.log(`Warp completed!`);
    yield fleet.getSageGame().getQuattrinoBalance();
    if (waitCooldown) {
        yield (0, wait_1.wait)(fleet.getMovementStats().warpCoolDown);
    }
    // action ends
    return { type: "Success" };
});
exports.warpToSector = warpToSector;
