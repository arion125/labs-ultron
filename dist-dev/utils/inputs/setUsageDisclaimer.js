"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setUsageDisclaimer = void 0;
const fs_extra_1 = require("fs-extra");
const inquirer_1 = __importDefault(require("inquirer"));
const checkKeypairFile_1 = require("./checkKeypairFile");
const setUsageDisclaimer = (keypairPath) => {
    const ckf = (0, checkKeypairFile_1.checkKeypairFile)(keypairPath);
    if (ckf.type === "KeypairFileParsingError")
        (0, fs_extra_1.removeSync)(keypairPath);
    if (ckf.type === "Success")
        return Promise.resolve();
    console.log("Use of this tool is entirely at your own risk. A private key is required for the tool to function properly. The creator of this tool assumes no responsibility for any misuse or any consequences that arise from its use.");
    return inquirer_1.default.prompt([
        {
            type: "confirm",
            name: "usageDisclaimer",
            message: "Do you understand and accept the risks associated with using this tool, as outlined in the warning above?",
        },
    ]);
};
exports.setUsageDisclaimer = setUsageDisclaimer;
