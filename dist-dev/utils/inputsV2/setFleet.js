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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setFleetV2 = void 0;
const SageFleet_1 = require("../../src/SageFleet");
const inquirer_1 = __importDefault(require("inquirer"));
const data_source_1 = require("@staratlas/data-source");
const setFleetV2 = (player) => __awaiter(void 0, void 0, void 0, function* () {
    const fleets = yield player.getAllFleetsAsync();
    if (fleets.type !== "Success")
        return fleets;
    const { selectedFleet } = yield inquirer_1.default.prompt({
        type: "list",
        name: "selectedFleet",
        message: "Choose a fleet:",
        choices: fleets.data.map((fleet) => {
            return {
                name: (0, data_source_1.byteArrayToString)(fleet.data.fleetLabel),
                value: fleet,
            };
        }),
    });
    // Play with fleets (SageFleet.ts)
    const fleet = yield SageFleet_1.SageFleet.init(selectedFleet, player);
    return { type: "Success", data: fleet };
});
exports.setFleetV2 = setFleetV2;
