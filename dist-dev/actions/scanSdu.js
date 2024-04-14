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
exports.scanSdu = void 0;
const wait_1 = require("../utils/actions/wait");
const scanSdu = (fleet, counter) => __awaiter(void 0, void 0, void 0, function* () {
    // action starts
    console.log(`\n${counter}. Scanning sector...`);
    // data
    // ...
    // instruction
    const ix = yield fleet.ixScanForSurveyDataUnits();
    // issues and errors handling
    switch (ix.type) {
        // issues that lead to the next action of the main script or the end of the script
        case "NoEnoughFood":
            console.log("No enough food to scan");
            return ix;
        case "FleetCargoIsFull":
            console.log("Your fleet cargo is full");
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
    console.log(`Scan completed!`);
    console.log(`\nWaiting Scan Cooldown for ${fleet.getStats().miscStats.scanCoolDown} seconds...`);
    yield (0, wait_1.wait)(fleet.getStats().miscStats.scanCoolDown);
    // action ends
    return { type: "Success" };
});
exports.scanSdu = scanSdu;
