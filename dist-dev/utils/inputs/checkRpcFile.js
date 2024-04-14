"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRpcFile = void 0;
const fs_extra_1 = require("fs-extra");
const validateRpcUrl_1 = require("./validateRpcUrl");
const checkRpcFile = (rpcPath) => {
    if (!(0, fs_extra_1.existsSync)(rpcPath))
        return { type: "RpcFileNotFound" };
    const rpcUrl = (0, fs_extra_1.readFileSync)(rpcPath).toString();
    return (0, validateRpcUrl_1.validateRpcUrl)(rpcUrl);
};
exports.checkRpcFile = checkRpcFile;
