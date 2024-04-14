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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKeypairFromSecret = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const decryptKeypair_1 = require("./decryptKeypair");
const getKeypairFromSecret = (profile) => __awaiter(void 0, void 0, void 0, function* () {
    const answer = yield inquirer_1.default.prompt([
        {
            type: "password",
            name: "secret",
            message: "Enter your password to start:",
            validate: (input) => {
                const secret = Buffer.from(input);
                const keypair = (0, decryptKeypair_1.decryptKeypair)(secret, profile);
                if (keypair.type !== "Success") {
                    return "Wrong password or incorrect keypair, please retry";
                }
                return true;
            },
        },
    ]);
    const secret = Buffer.from(answer.secret);
    const keypair = (0, decryptKeypair_1.decryptKeypair)(secret, profile);
    if (keypair.type !== "Success") {
        console.log("Wrong password or incorrect keypair, please retry");
        process.exit(1);
    }
    return keypair.result;
});
exports.getKeypairFromSecret = getKeypairFromSecret;
