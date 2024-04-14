"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationMessage = void 0;
var NotificationMessage;
(function (NotificationMessage) {
    NotificationMessage["CARGO_SUCCESS"] = "TRANSPORT cycle completed SUCCESSFULLY";
    NotificationMessage["MINING_SUCCESS"] = "MINING cycle completed SUCCESSFULLY";
    NotificationMessage["MINING_CARGO_SUCCESS"] = "MINING and TRANSPORT cycle completed SUCCESSFULLY";
    NotificationMessage["CARGO_ERROR"] = "An ERROR occurred during TRANSPORT";
    NotificationMessage["MINING_ERROR"] = "An ERROR occurred during MINING";
    NotificationMessage["MINING_CARGO_ERROR"] = "An ERROR occurred during the MINING and TRANSPORT cycle";
    NotificationMessage["SCAN_ERROR"] = "An ERROR occurred during SCANNING";
    NotificationMessage["FAIL_WARNING"] = "An action has FAILED and is REPEATING. If the problem persists after 4-5 retry, set the fleet in the required state or contact the support";
    NotificationMessage["SCAN_SUCCESS"] = "SDUs have been successfully deposited in Starbase";
})(NotificationMessage || (exports.NotificationMessage = NotificationMessage = {}));
