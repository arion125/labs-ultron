"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfileRpcPath = void 0;
const constants_1 = require("../../common/constants");
const getProfileRpcPath = (profile) => constants_1.rpcPaths[profile];
exports.getProfileRpcPath = getProfileRpcPath;
