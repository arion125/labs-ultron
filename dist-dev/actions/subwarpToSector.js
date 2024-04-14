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
exports.subwarpToSector = void 0;
const wait_1 = require("../utils/actions/wait");
const anchor_1 = require("@staratlas/anchor");
const subwarpToSector = (fleet, sector, fuelNeeded) => __awaiter(void 0, void 0, void 0, function* () {
    // action starts
    console.log(`\nStart subwarp...`);
    // data
    const sectorsDistance = fleet.getSageGame().calculateDistanceBySector(fleet.getCurrentSector(), sector);
    const timeToSubwarp = fleet.calculateSubwarpTimeWithDistance(sectorsDistance);
    // instruction
    const ix = yield fleet.ixSubwarpToSector(sector, new anchor_1.BN(fuelNeeded));
    // issues and errors handling
    switch (ix.type) {
        // issues that lead to the next action of the main script or the end of the script
        case "NoEnoughFuelToSubwarp":
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
    console.log(`Waiting for ${timeToSubwarp} seconds...`);
    yield (0, wait_1.wait)(timeToSubwarp);
    console.log(`Subwarp completed!`);
    yield fleet.getSageGame().getQuattrinoBalance();
    // action ends
    return { type: "Success" };
});
exports.subwarpToSector = subwarpToSector;
