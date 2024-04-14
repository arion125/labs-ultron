"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.starbasesInfo = exports.priority = exports.PriorityLevelValue = exports.PriorityLevel = exports.movements = exports.MovementType = exports.verifiedRpc = exports.keypairPaths = exports.rpcPaths = exports.configDir3 = exports.configDir2 = exports.configDir1 = exports.activites = exports.profiles = exports.resetOptions = exports.startOptions = exports.quattrinoTokenPubkey = exports.MAX_AMOUNT = void 0;
const web3_js_1 = require("@solana/web3.js");
const os_1 = require("os");
const path_1 = __importDefault(require("path"));
const anchor_1 = require("@staratlas/anchor");
exports.MAX_AMOUNT = 999999999;
exports.quattrinoTokenPubkey = new web3_js_1.PublicKey("qtr6BUeMKtt65HdYxXm75fLZ19184w4Yh4ZaPp4Ppks");
exports.startOptions = ["Start", "Settings"];
exports.resetOptions = [
    "Reset Profile 1 - Keypair",
    "Reset Profile 1 - RPC",
    "Reset Profile 2 - Keypair",
    "Reset Profile 2 - RPC",
    "Reset Profile 3 - Keypair",
    "Reset Profile 3 - RPC",
];
exports.profiles = ["Profile 1", "Profile 2", "Profile 3"];
exports.activites = ["Mining", "Cargo", "Combo", "Scan"];
exports.configDir1 = path_1.default.join((0, os_1.homedir)(), ".ultronConfig1");
exports.configDir2 = path_1.default.join((0, os_1.homedir)(), ".ultronConfig2");
exports.configDir3 = path_1.default.join((0, os_1.homedir)(), ".ultronConfig3");
const rpcPath = (configDir) => path_1.default.join(configDir, "rpc.txt");
exports.rpcPaths = {
    "Profile 1": rpcPath(exports.configDir1),
    "Profile 2": rpcPath(exports.configDir2),
    "Profile 3": rpcPath(exports.configDir3),
};
const keypairPath = (configDir) => path_1.default.join(configDir, "keypair.json");
exports.keypairPaths = {
    "Profile 1": keypairPath(exports.configDir1),
    "Profile 2": keypairPath(exports.configDir2),
    "Profile 3": keypairPath(exports.configDir3),
};
exports.verifiedRpc = [
    "rpc.hellomoon.io",
    "solana-mainnet.g.alchemy.com",
    "mainnet.helius-rpc.com",
    "rpc.ironforge.network", // !! IronForge restituisce sempre un errore GENERICO StructError in caso di errore di un'istruzione
    "solana-mainnet.api.syndica.io",
    // aggiungere QuickNode
];
var MovementType;
(function (MovementType) {
    MovementType["Warp"] = "Warp";
    MovementType["Subwarp"] = "Subwarp";
})(MovementType || (exports.MovementType = MovementType = {}));
exports.movements = [
    MovementType.Warp,
    MovementType.Subwarp,
];
var PriorityLevel;
(function (PriorityLevel) {
    PriorityLevel["None"] = "None";
    PriorityLevel["Default"] = "Default";
    PriorityLevel["Low"] = "Low";
    PriorityLevel["Medium"] = "Medium";
    PriorityLevel["High"] = "High";
    PriorityLevel["Custom"] = "Custom";
})(PriorityLevel || (exports.PriorityLevel = PriorityLevel = {}));
var PriorityLevelValue;
(function (PriorityLevelValue) {
    PriorityLevelValue[PriorityLevelValue["Default"] = 0] = "Default";
    PriorityLevelValue[PriorityLevelValue["Low"] = 10000] = "Low";
    PriorityLevelValue[PriorityLevelValue["Medium"] = 100000] = "Medium";
    PriorityLevelValue[PriorityLevelValue["High"] = 500000] = "High";
    PriorityLevelValue[PriorityLevelValue["MaxCustom"] = 1000000] = "MaxCustom";
})(PriorityLevelValue || (exports.PriorityLevelValue = PriorityLevelValue = {}));
exports.priority = [
    PriorityLevel.Default,
    PriorityLevel.Low,
    PriorityLevel.Medium,
    PriorityLevel.High,
    PriorityLevel.Custom,
    PriorityLevel.None
];
exports.starbasesInfo = [
    {
        name: "MUD",
        coords: [new anchor_1.BN(0), new anchor_1.BN(-39)],
    },
    {
        name: "MUD2",
        coords: [new anchor_1.BN(2), new anchor_1.BN(-34)],
    },
    {
        name: "MUD3",
        coords: [new anchor_1.BN(10), new anchor_1.BN(-41)],
    },
    {
        name: "MUD4",
        coords: [new anchor_1.BN(-2), new anchor_1.BN(-44)],
    },
    {
        name: "MUD5",
        coords: [new anchor_1.BN(-10), new anchor_1.BN(-37)],
    },
    {
        name: "MRZ1",
        coords: [new anchor_1.BN(-15), new anchor_1.BN(-33)],
    },
    {
        name: "MRZ2",
        coords: [new anchor_1.BN(12), new anchor_1.BN(-31)],
    },
    {
        name: "MRZ3",
        coords: [new anchor_1.BN(-22), new anchor_1.BN(-25)],
    },
    {
        name: "MRZ4",
        coords: [new anchor_1.BN(-8), new anchor_1.BN(-24)],
    },
    {
        name: "MRZ5",
        coords: [new anchor_1.BN(2), new anchor_1.BN(-23)],
    },
    {
        name: "MRZ6",
        coords: [new anchor_1.BN(11), new anchor_1.BN(-16)],
    },
    {
        name: "MRZ7",
        coords: [new anchor_1.BN(21), new anchor_1.BN(-26)],
    },
    {
        name: "MRZ8",
        coords: [new anchor_1.BN(-30), new anchor_1.BN(-16)],
    },
    {
        name: "MRZ9",
        coords: [new anchor_1.BN(-14), new anchor_1.BN(-16)],
    },
    {
        name: "MRZ10",
        coords: [new anchor_1.BN(23), new anchor_1.BN(-12)],
    },
    {
        name: "MRZ11",
        coords: [new anchor_1.BN(31), new anchor_1.BN(-19)],
    },
    {
        name: "MRZ12",
        coords: [new anchor_1.BN(-16), new anchor_1.BN(0)],
    },
    {
        name: "ONI",
        coords: [new anchor_1.BN(-40), new anchor_1.BN(30)],
    },
    {
        name: "ONI2",
        coords: [new anchor_1.BN(-42), new anchor_1.BN(35)],
    },
    {
        name: "ONI3",
        coords: [new anchor_1.BN(-30), new anchor_1.BN(30)],
    },
    {
        name: "ONI4",
        coords: [new anchor_1.BN(-38), new anchor_1.BN(25)],
    },
    {
        name: "ONI5",
        coords: [new anchor_1.BN(-47), new anchor_1.BN(30)],
    },
    {
        name: "MRZ13",
        coords: [new anchor_1.BN(-36), new anchor_1.BN(-7)],
    },
    {
        name: "MRZ14",
        coords: [new anchor_1.BN(-23), new anchor_1.BN(4)],
    },
    {
        name: "MRZ18",
        coords: [new anchor_1.BN(-40), new anchor_1.BN(3)],
    },
    {
        name: "MRZ19",
        coords: [new anchor_1.BN(-35), new anchor_1.BN(12)],
    },
    {
        name: "MRZ20",
        coords: [new anchor_1.BN(-25), new anchor_1.BN(15)],
    },
    {
        name: "MRZ24",
        coords: [new anchor_1.BN(-45), new anchor_1.BN(15)],
    },
    {
        name: "MRZ25",
        coords: [new anchor_1.BN(-18), new anchor_1.BN(23)],
    },
    {
        name: "MRZ26",
        coords: [new anchor_1.BN(-9), new anchor_1.BN(24)],
    },
    {
        name: "MRZ29",
        coords: [new anchor_1.BN(-22), new anchor_1.BN(32)],
    },
    {
        name: "MRZ30",
        coords: [new anchor_1.BN(-19), new anchor_1.BN(40)],
    },
    {
        name: "MRZ31",
        coords: [new anchor_1.BN(-8), new anchor_1.BN(35)],
    },
    {
        name: "MRZ36",
        coords: [new anchor_1.BN(0), new anchor_1.BN(16)],
    },
    {
        name: "Ustur",
        coords: [new anchor_1.BN(40), new anchor_1.BN(30)],
    },
    {
        name: "UST2",
        coords: [new anchor_1.BN(42), new anchor_1.BN(35)],
    },
    {
        name: "UST3",
        coords: [new anchor_1.BN(48), new anchor_1.BN(32)],
    },
    {
        name: "UST4",
        coords: [new anchor_1.BN(38), new anchor_1.BN(25)],
    },
    {
        name: "UST5",
        coords: [new anchor_1.BN(30), new anchor_1.BN(28)],
    },
    {
        name: "MRZ15",
        coords: [new anchor_1.BN(22), new anchor_1.BN(5)],
    },
    {
        name: "MRZ16",
        coords: [new anchor_1.BN(39), new anchor_1.BN(-1)],
    },
    {
        name: "MRZ17",
        coords: [new anchor_1.BN(16), new anchor_1.BN(-5)],
    },
    {
        name: "MRZ21",
        coords: [new anchor_1.BN(25), new anchor_1.BN(14)],
    },
    {
        name: "MRZ22",
        coords: [new anchor_1.BN(35), new anchor_1.BN(16)],
    },
    {
        name: "MRZ23",
        coords: [new anchor_1.BN(44), new anchor_1.BN(10)],
    },
    {
        name: "MRZ27",
        coords: [new anchor_1.BN(2), new anchor_1.BN(26)],
    },
    {
        name: "MRZ28",
        coords: [new anchor_1.BN(17), new anchor_1.BN(21)],
    },
    {
        name: "MRZ32",
        coords: [new anchor_1.BN(5), new anchor_1.BN(44)],
    },
    {
        name: "MRZ33",
        coords: [new anchor_1.BN(13), new anchor_1.BN(37)],
    },
    {
        name: "MRZ34",
        coords: [new anchor_1.BN(22), new anchor_1.BN(31)],
    },
    {
        name: "MRZ35",
        coords: [new anchor_1.BN(49), new anchor_1.BN(20)],
    },
];
