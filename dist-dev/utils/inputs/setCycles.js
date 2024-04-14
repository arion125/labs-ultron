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
exports.setCycles = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const setCycles = () => __awaiter(void 0, void 0, void 0, function* () {
    const answer = yield inquirer_1.default.prompt([
        {
            type: "input",
            name: "cycles",
            message: "How many cycles do you want to run?",
            default: "999999999",
            validate: (input) => {
                if (parseInt(input) && parseInt(input) > 0)
                    return true;
                return "Please input a valid number.";
            },
        },
    ]);
    const cycles = parseInt(answer.cycles);
    return cycles;
});
exports.setCycles = setCycles;
