"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptKeypair = void 0;
const web3_js_1 = require("@solana/web3.js");
const fs_extra_1 = require("fs-extra");
const crypto_1 = require("../crypto");
const getProfileKeypairPath_1 = require("./getProfileKeypairPath");
const decryptKeypair = (secret, profile) => {
    const keypairPath = (0, getProfileKeypairPath_1.getProfileKeypairPath)(profile);
    try {
        const fileContent = (0, fs_extra_1.readFileSync)(keypairPath).toString();
        const encryptedKeypair = JSON.parse(fileContent);
        if (!encryptedKeypair.iv ||
            !encryptedKeypair.content ||
            !encryptedKeypair.salt ||
            !encryptedKeypair.tag) {
            return {
                type: "EncryptedKeypairParsingError",
            };
        }
        const decryptedKeypair = (0, crypto_1.decrypt)(encryptedKeypair, secret);
        if (decryptedKeypair.type !== "Success") {
            return decryptedKeypair;
        }
        const keypair = web3_js_1.Keypair.fromSecretKey(Uint8Array.from(decryptedKeypair.result));
        if (!web3_js_1.PublicKey.isOnCurve(keypair.publicKey.toBytes())) {
            return { type: "KeypairIsNotOnCurve" };
        }
        return { type: "Success", result: keypair };
    }
    catch (e) {
        return { type: "DecryptKeypairError" };
    }
};
exports.decryptKeypair = decryptKeypair;
