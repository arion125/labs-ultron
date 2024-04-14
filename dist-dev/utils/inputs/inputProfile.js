"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inputProfile = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const constants_1 = require("../../common/constants");
const inputProfile = () => {
    return inquirer_1.default.prompt([
        {
            type: "list",
            name: "profile",
            message: "Choose the profile to use:",
            choices: constants_1.profiles,
        },
    ]);
};
exports.inputProfile = inputProfile;
