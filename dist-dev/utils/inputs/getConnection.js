"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConnection = void 0;
const web3_js_1 = require("@solana/web3.js");
const checkRpcFile_1 = require("./checkRpcFile");
const getProfileRpcPath_1 = require("./getProfileRpcPath");
const getConnection = (profile) => {
    const rpcPath = (0, getProfileRpcPath_1.getProfileRpcPath)(profile);
    try {
        const cr = (0, checkRpcFile_1.checkRpcFile)(rpcPath);
        if (cr.type === "InvalidRpcUrl")
            return cr;
        if (cr.type === "RpcFileNotFound")
            return cr;
        const connection = new web3_js_1.Connection(cr.result.toString(), "confirmed");
        return { type: "Success", data: connection };
    }
    catch (e) {
        return { type: "GetConnectionError" };
    }
};
exports.getConnection = getConnection;
