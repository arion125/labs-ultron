"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendTransactionFailed = exports.BuildAndSignTransactionError = exports.NoEnoughTokensToPerformLabsAction = exports.NoEnoughRepairKits = void 0;
class NoEnoughRepairKits extends Error {
    constructor() {
        super("NoEnoughRepairKits");
        this.name = "NoEnoughRepairKits";
    }
}
exports.NoEnoughRepairKits = NoEnoughRepairKits;
class NoEnoughTokensToPerformLabsAction extends Error {
    constructor() {
        super("NoEnoughTokensToPerformLabsAction");
        this.name = "NoEnoughTokensToPerformLabsAction";
    }
}
exports.NoEnoughTokensToPerformLabsAction = NoEnoughTokensToPerformLabsAction;
class BuildAndSignTransactionError extends Error {
    constructor() {
        super("BuildAndSignTransactionError");
        this.name = "BuildAndSignTransactionError";
    }
}
exports.BuildAndSignTransactionError = BuildAndSignTransactionError;
class SendTransactionFailed extends Error {
    constructor() {
        super("SendTransactionFailed");
        this.name = "SendTransactionFailed";
    }
}
exports.SendTransactionFailed = SendTransactionFailed;
