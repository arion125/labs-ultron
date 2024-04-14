"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setRpc = void 0;
const fs_extra_1 = require("fs-extra");
const inquirer_1 = __importDefault(require("inquirer"));
const checkRpcFile_1 = require("./checkRpcFile");
const validateRpcUrl_1 = require("./validateRpcUrl");
const setRpc = (rpcPath) => {
    const cr = (0, checkRpcFile_1.checkRpcFile)(rpcPath);
    if (cr.type === "InvalidRpcUrl")
        (0, fs_extra_1.removeSync)(rpcPath);
    if (cr.type === "Success")
        return Promise.resolve();
    return inquirer_1.default.prompt([
        {
            type: "input",
            name: "rpcUrl",
            message: "Enter your rpc url:",
            validate: (input) => {
                const cr = (0, validateRpcUrl_1.validateRpcUrl)(input);
                if (cr.type === "InvalidRpcUrl")
                    return "Wrong rpc url, please retry again";
                (0, fs_extra_1.outputFileSync)(rpcPath, cr.result.toString());
                (0, fs_extra_1.chmodSync)(rpcPath, 0o600);
                return true;
            },
        },
    ]);
};
exports.setRpc = setRpc;
