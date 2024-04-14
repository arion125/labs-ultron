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
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupProfileData = void 0;
const getProfileKeypairPath_1 = require("./getProfileKeypairPath");
const getProfileRpcPath_1 = require("./getProfileRpcPath");
const setKeypair_1 = require("./setKeypair");
const setRpc_1 = require("./setRpc");
const setUsageDisclaimer_1 = require("./setUsageDisclaimer");
const setupProfileData = (profile) => __awaiter(void 0, void 0, void 0, function* () {
    const keypairPath = (0, getProfileKeypairPath_1.getProfileKeypairPath)(profile);
    const rpcPath = (0, getProfileRpcPath_1.getProfileRpcPath)(profile);
    yield (0, setUsageDisclaimer_1.setUsageDisclaimer)(keypairPath);
    yield (0, setKeypair_1.setKeypair)(keypairPath);
    yield (0, setRpc_1.setRpc)(rpcPath);
});
exports.setupProfileData = setupProfileData;
