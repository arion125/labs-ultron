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
exports.wait = void 0;
const cliProgress = __importStar(require("cli-progress"));
const wait = (seconds) => {
    return new Promise((resolve) => {
        const progressBar = new cliProgress.SingleBar({
            format: "[{bar}]" + " " + "{percentage}%" + " | " + "ETA: {eta}s",
            hideCursor: true,
        }, cliProgress.Presets.legacy);
        progressBar.start(100, 0);
        let elapsed = 0;
        const interval = 1000;
        const timer = setInterval(() => {
            elapsed += interval;
            const progress = (elapsed / (seconds * 1000)) * 100;
            progressBar.update(Math.min(progress, 100));
            if (elapsed >= seconds * 1000) {
                clearInterval(timer);
                progressBar.stop();
                resolve();
            }
        }, interval);
    });
};
exports.wait = wait;
