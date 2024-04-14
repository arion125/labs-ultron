"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setKeypair = void 0;
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = __importDefault(require("bs58"));
const fs_extra_1 = require("fs-extra");
const inquirer_1 = __importDefault(require("inquirer"));
const crypto_1 = require("../crypto");
const checkKeypairFile_1 = require("./checkKeypairFile");
const setKeypair = (keypairPath) => {
    const ckf = (0, checkKeypairFile_1.checkKeypairFile)(keypairPath);
    if (ckf.type === "KeypairFileParsingError")
        (0, fs_extra_1.removeSync)(keypairPath);
    if (ckf.type === "Success")
        return Promise.resolve();
    const questions = [
        {
            type: "password",
            name: "secretKey",
            message: "Enter your base58 wallet private key:",
            validate: (input) => {
                try {
                    const secret = bs58_1.default.decode(input);
                    const keypair = web3_js_1.Keypair.fromSecretKey(secret);
                    if (!web3_js_1.PublicKey.isOnCurve(keypair.publicKey.toBytes()))
                        throw new Error("KeypairIsNotOnCurve");
                    return true;
                }
                catch (e) {
                    return "Wrong private key, please retry again";
                }
            },
        },
        {
            type: "password",
            name: "secret",
            message: "Enter a password (at least 8 characters with one capital, one number and one special character) to encrypt your private key. Be sure to save it in a safe place and do not share it with anyone:",
            validate: (input, answers) => {
                if (answers) {
                    const hasUpperCase = /[A-Z]/.test(input);
                    const hasLowerCase = /[a-z]/.test(input);
                    const hasNumber = /\d/.test(input);
                    const hasSpecialChar = /\W/.test(input);
                    if (input.length >= 8 &&
                        hasUpperCase &&
                        hasLowerCase &&
                        hasNumber &&
                        hasSpecialChar) {
                        return true;
                    }
                    return "The password must contain at least 8 characters with at least one capital, one number and one special character.";
                }
            },
        },
        {
            type: "password",
            name: "confirmSecret",
            message: "Confirm your password:",
            validate: (input, answers) => {
                if (answers && input === answers.secret) {
                    const secret = Buffer.from(input);
                    const keypair = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(answers.secretKey));
                    const encryptedKeypair = (0, crypto_1.encrypt)(keypair, secret);
                    if (encryptedKeypair.type !== "Success")
                        return `Encryption Failed, please retry. Error: ${encryptedKeypair.type}`;
                    (0, fs_extra_1.outputFileSync)(keypairPath, JSON.stringify(encryptedKeypair.result));
                    (0, fs_extra_1.chmodSync)(keypairPath, 0o400);
                    return true;
                }
                return "Passwords don't match. If you didn't remember the first password, restart Ultron.";
            },
        },
    ];
    return inquirer_1.default.prompt(questions);
};
exports.setKeypair = setKeypair;
