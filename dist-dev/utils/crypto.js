"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decrypt = exports.encrypt = void 0;
const crypto_1 = __importStar(require("crypto"));
const ALGORITHM = "aes-256-gcm";
const KEY_SIZE = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 16;
const ITERATIONS = 100000;
const DIGEST = "sha256";
const HEX_SALT_LENGTH = SALT_LENGTH * 2;
const HEX_IV_LENGTH = IV_LENGTH * 2;
const HEX_TAG_LENGTH = 16 * 2;
const MIN_SECRET_LENGTH = 32;
function validateCryptoInputs(secret, components) {
    if (secret.length < MIN_SECRET_LENGTH) {
        return { type: "SecretTooShort" };
    }
    if (components) {
        if (components.salt.length !== HEX_SALT_LENGTH) {
            return { type: "InvalidSaltLength" };
        }
        if (components.iv.length !== HEX_IV_LENGTH) {
            return { type: "InvalidIVLength" };
        }
        if (components.tag.length !== HEX_TAG_LENGTH) {
            return { type: "InvalidTagLength" };
        }
        if (!/^[a-f0-9]+$/i.test(components.content)) {
            return { type: "InvalidContentHex" };
        }
    }
    return { type: "Success" };
}
const encrypt = (keypair, secret) => {
    try {
        const salt = crypto_1.default.randomBytes(SALT_LENGTH);
        const hash = crypto_1.default.pbkdf2Sync(secret, salt, ITERATIONS, KEY_SIZE, DIGEST);
        validateCryptoInputs(hash);
        const iv = crypto_1.default.randomBytes(IV_LENGTH);
        const cipher = crypto_1.default.createCipheriv(ALGORITHM, hash, iv);
        (0, crypto_1.randomFillSync)(hash);
        let encrypted = cipher.update(Buffer.from(keypair.secretKey));
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        const authTag = cipher.getAuthTag();
        return {
            type: "Success",
            result: {
                iv: iv.toString("hex"),
                salt: salt.toString("hex"),
                content: encrypted.toString("hex"),
                tag: authTag.toString("hex"),
            },
        };
    }
    catch (error) {
        return { type: "EncryptionFailed" };
    }
};
exports.encrypt = encrypt;
const decrypt = (encryptedKeypair, secret) => {
    try {
        const salt = Buffer.from(encryptedKeypair.salt, "hex");
        const iv = Buffer.from(encryptedKeypair.iv, "hex");
        const encryptedText = Buffer.from(encryptedKeypair.content, "hex");
        const authTag = Buffer.from(encryptedKeypair.tag, "hex");
        const hash = crypto_1.default.pbkdf2Sync(secret, salt, ITERATIONS, KEY_SIZE, DIGEST);
        validateCryptoInputs(hash);
        const decipher = crypto_1.default.createDecipheriv(ALGORITHM, hash, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        (0, crypto_1.randomFillSync)(salt);
        (0, crypto_1.randomFillSync)(hash);
        (0, crypto_1.randomFillSync)(iv);
        (0, crypto_1.randomFillSync)(encryptedText);
        (0, crypto_1.randomFillSync)(authTag);
        return { type: "Success", result: decrypted };
    }
    catch (error) {
        return { type: "DecryptionFailed" };
    }
};
exports.decrypt = decrypt;
