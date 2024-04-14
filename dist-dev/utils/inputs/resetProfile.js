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
exports.resetProfile = void 0;
const fs_extra_1 = require("fs-extra");
const inquirer_1 = __importDefault(require("inquirer"));
const constants_1 = require("../../common/constants");
const resetProfile = () => __awaiter(void 0, void 0, void 0, function* () {
    const answer = yield inquirer_1.default.prompt([
        {
            type: "list",
            name: "resetProfile",
            message: "Choose an option:",
            choices: constants_1.resetOptions,
        },
    ]);
    const resetOption = answer.resetProfile;
    switch (resetOption) {
        case "Reset Profile 1 - Keypair":
            (0, fs_extra_1.removeSync)(constants_1.keypairPaths["Profile 1"]);
            console.log("Profile 1 keypair reset success. Please restart Ultron.");
            return true;
        case "Reset Profile 1 - RPC":
            (0, fs_extra_1.removeSync)(constants_1.rpcPaths["Profile 1"]);
            console.log("Profile 1 RPC reset success. Please restart Ultron.");
            return true;
        case "Reset Profile 2 - Keypair":
            (0, fs_extra_1.removeSync)(constants_1.keypairPaths["Profile 2"]);
            console.log("Profile 2 keypair reset success. Please restart Ultron.");
            return true;
        case "Reset Profile 2 - RPC":
            (0, fs_extra_1.removeSync)(constants_1.rpcPaths["Profile 2"]);
            console.log("Profile 2 RPC reset success. Please restart Ultron.");
            return true;
        case "Reset Profile 3 - Keypair":
            (0, fs_extra_1.removeSync)(constants_1.keypairPaths["Profile 3"]);
            console.log("Profile 3 keypair reset success. Please restart Ultron.");
            return true;
        case "Reset Profile 3 - RPC":
            (0, fs_extra_1.removeSync)(constants_1.rpcPaths["Profile 3"]);
            console.log("Profile 3 RPC reset success. Please restart Ultron.");
            return true;
        default:
            return false;
    }
});
exports.resetProfile = resetProfile;
