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
exports.setCustomPriority = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const setCustomPriority = () => __awaiter(void 0, void 0, void 0, function* () {
    return inquirer_1.default.prompt([
        {
            type: "input",
            name: "customPriority",
            message: "Set custom priority fee value (< 1000000):",
            default: 0,
            validate: (input) => {
                if (isNaN(input)) {
                    return "Please enter a number";
                }
                if (input < 0 || input > 1000000) {
                    return "Please enter a number between 0 and 1000000";
                }
                return true;
            }
        },
    ]);
});
exports.setCustomPriority = setCustomPriority;
