#!/usr/bin/env node
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
const package_json_1 = require("./package.json");
const SageGame_1 = require("./src/SageGame");
const SagePlayer_1 = require("./src/SagePlayer");
const getConnection_1 = require("./utils/inputs/getConnection");
const getKeypairFromSecret_1 = require("./utils/inputs/getKeypairFromSecret");
const inputProfile_1 = require("./utils/inputs/inputProfile");
const resetProfile_1 = require("./utils/inputs/resetProfile");
const setStart_1 = require("./utils/inputs/setStart");
const setupProfileData_1 = require("./utils/inputs/setupProfileData");
const miningV2_1 = require("./scripts/miningV2");
const cargoV2_1 = require("./scripts/cargoV2");
const setPriority_1 = require("./utils/inputsV2/setPriority");
const constants_1 = require("./common/constants");
const setCustomPriority_1 = require("./utils/inputsV2/setCustomPriority");
const cargoMiningV2_1 = require("./scripts/cargoMiningV2");
const scanV2_1 = require("./scripts/scanV2");
const setActivity_1 = require("./utils/inputsV2/setActivity");
const test = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Welcome to Ultron ${package_json_1.version}!`);
    const { startOption } = yield (0, setStart_1.setStart)();
    if (startOption === "Settings") {
        yield (0, resetProfile_1.resetProfile)();
        return;
    }
    // qui l'utente configura il livello di priority fee desiderato e l'eventuale custom priority fee value
    const priorityFees = yield (0, setPriority_1.setPriority)();
    const { customPriority } = priorityFees.priority === constants_1.PriorityLevel.Custom ? yield (0, setCustomPriority_1.setCustomPriority)() : { customPriority: 0 };
    // qui l'utente sceglie il profilo desiderato
    const { profile } = yield (0, inputProfile_1.inputProfile)();
    // qui si controlla se il profilo esiste già, se no, lo si crea
    yield (0, setupProfileData_1.setupProfileData)(profile);
    // qui si impostano il keypair e la connection
    const keypair = yield (0, getKeypairFromSecret_1.getKeypairFromSecret)(profile);
    const connection = (0, getConnection_1.getConnection)(profile);
    // FIX: se la connessione non è andata a buon fine, Ultron riprova
    if (connection.type !== "Success") {
        console.log("Connection failed, please retry.");
        return;
    }
    // 1. Setup environment (SageGame.ts) [keypair required]
    const sage = yield SageGame_1.SageGame.init(keypair, connection.data, { level: priorityFees.priority, value: customPriority });
    // console.log(sage.getGame().data)
    // 2. Setup player (SagePlayer.ts)
    const playerProfiles = yield sage.getPlayerProfilesAsync();
    if (playerProfiles.type !== "Success") {
        console.log("Error getting player profiles.");
        return;
    }
    const player = yield SagePlayer_1.SagePlayer.init(sage, playerProfiles.data[0]);
    const activity = yield (0, setActivity_1.setActivityV2)();
    /* const userPoints = await player.getUserPointsAsync();
    if (userPoints.type !== "Success") return;
    console.log(userPoints.data) */
    switch (activity) {
        case "Mining":
            // 3. Play with mining
            const mining = yield (0, miningV2_1.miningV2)(player);
            if (mining.type !== "Success") {
                console.log("Mining failed.", mining.type);
                return;
            }
            break;
        case "Cargo":
            // 4. Play with cargo
            const cargo = yield (0, cargoV2_1.cargoV2)(player);
            if (cargo.type !== "Success") {
                console.log("Cargo failed.", cargo.type);
                return;
            }
            break;
        case "Combo":
            // 5. Play with cargo mining
            const cargoMining = yield (0, cargoMiningV2_1.cargoMiningV2)(player);
            if (cargoMining.type !== "Success") {
                console.log("Cargo mining failed.", cargoMining.type);
                return;
            }
            break;
        case "Scan":
            // 6. Play with scanning
            const scan = yield (0, scanV2_1.scanV2)(player);
            if (scan.type !== "Success") {
                console.log("\nScan failed.", scan.type);
                return;
            }
            break;
        default:
            return;
    }
    // 7. Play with crafting (SageCrafting.ts)
    // ...
    // 8. Play with galactic marketplace (GalacticMarketplace.ts)
    // ...
    /* const data = await sage.getPlanets()
    console.log(data) */
    /*  const data = await sage.getResourcesByPlanet(sage.getPlanets().find(item => item.data.planetType === PlanetType.AsteroidBelt)!)
     if (data.type !== "Success") throw new Error(data.type);
     console.log(sage.getResourceName(data.data[0])); */
});
test().catch((err) => {
    console.error(err);
    process.exit(1);
});
