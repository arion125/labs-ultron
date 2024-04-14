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
exports.actionWrapper = void 0;
const errors_1 = require("../../common/errors");
const notifications_1 = require("../../common/notifications");
const sendNotification_1 = require("./sendNotification");
const wait_1 = require("./wait");
// TODO: If an action fails, go to the next action until find the correct one (in some cases)
// If a SAGE Labs action fails, send a notification and retry the same action every minute
function actionWrapper(func, ...args) {
    return __awaiter(this, void 0, void 0, function* () {
        while (true) {
            try {
                return yield func(...args);
            }
            catch (e) {
                if (e instanceof errors_1.NoEnoughTokensToPerformLabsAction)
                    throw e;
                console.error(`\nAction failed. Auto retry in 10 seconds. ${e}`);
                (0, sendNotification_1.sendNotification)(notifications_1.NotificationMessage.FAIL_WARNING);
                yield (0, wait_1.wait)(10);
            }
        }
    });
}
exports.actionWrapper = actionWrapper;
