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
exports.setScanCoordinates = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const anchor_1 = require("@staratlas/anchor");
const setScanCoordinates = () => __awaiter(void 0, void 0, void 0, function* () {
    const answerX = yield inquirer_1.default.prompt([
        {
            type: "input",
            name: "coordinate",
            message: "Enter coordinates to start scan. Choose X (Beetwen -50 and 50):",
            validate: (input) => {
                if (parseInt(input) >= -50 && parseInt(input) <= 50)
                    return true;
                return "Please input a valid number.";
            },
        },
    ]);
    const answerY = yield inquirer_1.default.prompt([
        {
            type: "input",
            name: "coordinate",
            message: "Enter coordinates to start scan. Choose Y (Beetwen -50 and 50):",
            validate: (input) => {
                if (parseInt(input) >= -50 && parseInt(input) <= 50)
                    return true;
                return "Please input a valid number.";
            },
        },
    ]);
    const x = parseInt(answerX.coordinate);
    const y = parseInt(answerY.coordinate);
    return { type: "Success", data: [new anchor_1.BN(x), new anchor_1.BN(y)] };
});
exports.setScanCoordinates = setScanCoordinates;
