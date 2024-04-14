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
exports.setResourcesAmountV2 = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const SageGame_1 = require("../../src/SageGame");
const processInput = (input) => __awaiter(void 0, void 0, void 0, function* () {
    const resourcePairs = input.split(",");
    const resources = [];
    for (const pair of resourcePairs) {
        const regex = /(\w+)\s+(\d+|ALL)/i;
        const match = regex.exec(pair.trim());
        if (match) {
            const resource = match[1];
            if (!SageGame_1.ResourceName[resource])
                return [];
            const amount = match[2].toUpperCase() === "ALL" ? 999999999 : parseInt(match[2], 10);
            resources.push({
                resource: SageGame_1.ResourceName[resource],
                amount: amount,
            });
        }
        else {
            return [];
        }
    }
    return resources;
});
const setResourcesAmountV2 = (promptMessage) => __awaiter(void 0, void 0, void 0, function* () {
    const answers = yield inquirer_1.default.prompt([
        {
            type: "input",
            name: "resources",
            message: promptMessage,
            validate: (input) => {
                if (!input) {
                    return true;
                }
                return processInput(input).then((processedResources) => {
                    if (processedResources.length > 0) {
                        return true;
                    }
                    return "Invalid resources, please try again.";
                });
            },
        },
    ]);
    const resources = answers.resources;
    if (!resources)
        return [];
    return processInput(resources);
});
exports.setResourcesAmountV2 = setResourcesAmountV2;
