"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRpcUrl = void 0;
const constants_1 = require("../../common/constants");
const validateRpcUrl = (rpcUrl) => {
    try {
        const url = new URL(rpcUrl);
        if (constants_1.verifiedRpc.includes(url.hostname) && url.protocol === "https:") {
            return { type: "Success", result: rpcUrl };
        }
        return { type: "InvalidRpcUrl" };
    }
    catch (e) {
        return { type: "InvalidRpcUrl" };
    }
};
exports.validateRpcUrl = validateRpcUrl;
