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
exports.setResourceToMine = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const sage_1 = require("@staratlas/sage");
const data_source_1 = require("@staratlas/data-source");
const setResourceToMine = (fleet, sector) => __awaiter(void 0, void 0, void 0, function* () {
    const planet = fleet.getSageGame().getPlanetsBySector(sector, sage_1.PlanetType.AsteroidBelt);
    if (planet.type !== "Success")
        return planet;
    const asteroid = planet.data[0];
    const resources = fleet.getSageGame().getResourcesByPlanet(asteroid);
    if (resources.type !== "Success")
        return resources;
    const minableResources = [];
    for (const resource of resources.data) {
        const mineItem = fleet.getSageGame().getMineItemByKey(resource.data.mineItem);
        if (mineItem.type !== "Success") {
            minableResources.length = 0;
            break;
        }
        minableResources.push({
            resource,
            mineItem: mineItem.data
        });
    }
    if (minableResources.length === 0) {
        return { type: "NoMinableResources" };
    }
    const { resourceToMine } = yield inquirer_1.default.prompt([
        {
            type: "list",
            name: "resourceToMine",
            message: "Choose the resource to mine:",
            choices: minableResources.map((minableResource) => ({
                name: (0, data_source_1.byteArrayToString)(minableResource.mineItem.data.name),
                value: minableResource
            }))
        },
    ]);
    return { type: "Success", data: resourceToMine };
});
exports.setResourceToMine = setResourceToMine;
