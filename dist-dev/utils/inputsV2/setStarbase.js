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
exports.setStarbaseV2 = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const data_source_1 = require("@staratlas/data-source");
const constants_1 = require("../../common/constants");
const setStarbaseV2 = (fleet, excludeFleetCurrentStarbase = false) => __awaiter(void 0, void 0, void 0, function* () {
    const indexMap = new Map(constants_1.starbasesInfo.map((item, index) => [item.name, index]));
    const starbases = fleet.getSageGame().getStarbases().map((starbase) => {
        const prettyName = fleet.getSageGame().getStarbasePrettyName(starbase);
        return {
            prettyName,
            data: starbase,
        };
    }).sort((a, b) => {
        const indexA = indexMap.get(a.prettyName) || indexMap.size;
        const indexB = indexMap.get(b.prettyName) || indexMap.size;
        return indexA - indexB;
    });
    const fleetCurrentSector = yield fleet.getCurrentSector();
    const { starbase } = yield inquirer_1.default.prompt([
        {
            type: "list",
            name: "starbase",
            message: "Choose the starbase destination:",
            choices: !excludeFleetCurrentStarbase
                ? starbases.map((starbase) => ({
                    name: fleet.getSageGame().bnArraysEqual(starbase.data.data.sector, fleetCurrentSector.data.coordinates) ?
                        `${starbase.prettyName} - ${(0, data_source_1.byteArrayToString)(starbase.data.data.name)} (current starbase)` :
                        `${starbase.prettyName} - ${(0, data_source_1.byteArrayToString)(starbase.data.data.name)}`,
                    value: starbase.data,
                }))
                : starbases.filter((starbase) => !fleet.getSageGame().bnArraysEqual(starbase.data.data.sector, fleetCurrentSector.data.coordinates)).map((starbase) => ({
                    name: `${starbase.prettyName} - ${(0, data_source_1.byteArrayToString)(starbase.data.data.name)}`,
                    value: starbase.data,
                }))
        },
    ]);
    return { type: "Success", data: starbase };
});
exports.setStarbaseV2 = setStarbaseV2;
