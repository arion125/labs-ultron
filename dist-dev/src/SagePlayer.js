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
exports.SagePlayer = void 0;
const profile_faction_1 = require("@staratlas/profile-faction");
const data_source_1 = require("@staratlas/data-source");
const sage_1 = require("@staratlas/sage");
const points_1 = require("@staratlas/points");
class SagePlayer {
    constructor(sageGame, playerProfile) {
        this.sageGame = sageGame;
        this.playerProfile = playerProfile;
        this.key = playerProfile.key;
    }
    static init(sageGame, playerProfile) {
        return __awaiter(this, void 0, void 0, function* () {
            const player = new SagePlayer(sageGame, playerProfile);
            const [userPoints] = yield Promise.all([
                player.getUserPointsAsync()
            ]);
            if (userPoints.type !== "Success")
                throw new Error(userPoints.type);
            player.userPoints = userPoints.data;
            return player;
        });
    }
    getPlayerProfile() {
        return this.playerProfile;
    }
    getSageGame() {
        return this.sageGame;
    }
    getProfileFactionAddress() {
        const [profileFaction] = profile_faction_1.ProfileFactionAccount.findAddress(this.sageGame.getPlayerProfileFactionProgram(), this.playerProfile.key);
        return profileFaction;
    }
    getSagePlayerProfileAddress() {
        const [sagePlayerProfile] = sage_1.SagePlayerProfile.findAddress(this.sageGame.getSageProgram(), this.playerProfile.key, this.sageGame.getGame().key);
        return sagePlayerProfile;
    }
    getStarbasePlayerAddress(starbase) {
        const [starbasePlayer] = sage_1.StarbasePlayer.findAddress(this.sageGame.getSageProgram(), starbase.key, this.getSagePlayerProfileAddress(), starbase.data.seqId);
        return starbasePlayer;
    }
    // Step 3B. Get all fleets owned by a player profile
    getAllFleetsAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fetchFleets = yield (0, data_source_1.readAllFromRPC)(this.sageGame.getProvider().connection, this.sageGame.getSageProgram(), sage_1.Fleet, "confirmed", [
                    {
                        memcmp: {
                            offset: 41,
                            bytes: this.playerProfile.key.toBase58(),
                        },
                    },
                ]);
                const fleets = fetchFleets.flatMap((fleet) => fleet.type === "ok" ? [fleet.data] : []);
                if (fleets.length === 0)
                    throw new Error();
                return { type: "Success", data: fleets };
            }
            catch (e) {
                return { type: "FleetsNotFound" };
            }
        });
    }
    getFleetByKeyAsync(fleetKey) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fleetAccount = yield (0, data_source_1.readFromRPCOrError)(this.sageGame.getProvider().connection, this.sageGame.getSageProgram(), fleetKey, sage_1.Fleet, "confirmed");
                return { type: "Success", data: fleetAccount };
            }
            catch (e) {
                return { type: "FleetNotFound" };
            }
        });
    }
    getStarbasePlayerByStarbaseAsync(starbase) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const starbasePlayer = yield (0, data_source_1.readFromRPCOrError)(this.sageGame.getProvider().connection, this.sageGame.getSageProgram(), this.getStarbasePlayerAddress(starbase), sage_1.StarbasePlayer, "confirmed");
                return { type: "Success", data: starbasePlayer };
            }
            catch (e) {
                return { type: "StarbasePlayerNotFound" };
            }
        });
    }
    getStarbasePlayerPodAsync(starbase) {
        return __awaiter(this, void 0, void 0, function* () {
            const starbasePlayerPod = yield this.getSageGame().getCargoPodsByAuthority(this.getStarbasePlayerAddress(starbase));
            if (starbasePlayerPod.type !== "Success")
                return starbasePlayerPod;
            return { type: "Success", data: starbasePlayerPod.data[0] };
        });
    }
    /** POINTS */
    getUserPointsAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fetchUserPoints = yield (0, data_source_1.readAllFromRPC)(this.sageGame.getProvider().connection, this.sageGame.getPointsProgram(), points_1.UserPoints, "confirmed", [
                    {
                        memcmp: {
                            offset: 9,
                            bytes: this.playerProfile.key.toBase58(),
                        },
                    }
                ]);
                const userPoints = fetchUserPoints.flatMap((item) => item.type === "ok" ? [item.data] : []);
                if (userPoints.length === 0)
                    throw new Error();
                return { type: "Success", data: userPoints };
            }
            catch (e) {
                return { type: "UserPointsNotFound" };
            }
        });
    }
    getMiningXpAccount() {
        return this.userPoints.filter((account) => account.data.pointCategory.equals(this.sageGame.getGamePoints().miningXpCategory.category))[0];
    }
    getMiningXpKey() {
        return points_1.UserPoints.findAddress(this.sageGame.getPointsProgram(), this.sageGame.getGamePoints().miningXpCategory.category, this.playerProfile.key)[0];
    }
    getPilotXpAccount() {
        return this.userPoints.filter((account) => account.data.pointCategory.equals(this.sageGame.getGamePoints().pilotXpCategory.category))[0];
    }
    getPilotXpKey() {
        return points_1.UserPoints.findAddress(this.sageGame.getPointsProgram(), this.sageGame.getGamePoints().pilotXpCategory.category, this.playerProfile.key)[0];
    }
    getCouncilRankXpAccount() {
        return this.userPoints.filter((account) => account.data.pointCategory.equals(this.sageGame.getGamePoints().councilRankXpCategory.category))[0];
    }
    getCouncilRankXpKey() {
        return points_1.UserPoints.findAddress(this.sageGame.getPointsProgram(), this.sageGame.getGamePoints().councilRankXpCategory.category, this.playerProfile.key)[0];
    }
    getCraftingXpAccount() {
        return this.userPoints.filter((account) => account.data.pointCategory.equals(this.sageGame.getGamePoints().craftingXpCategory.category))[0];
    }
    getCraftingXpKey() {
        return points_1.UserPoints.findAddress(this.sageGame.getPointsProgram(), this.sageGame.getGamePoints().craftingXpCategory.category, this.playerProfile.key)[0];
    }
    getDataRunningXpAccount() {
        return this.userPoints.filter((account) => account.data.pointCategory.equals(this.sageGame.getGamePoints().dataRunningXpCategory.category))[0];
    }
    getDataRunningXpKey() {
        return points_1.UserPoints.findAddress(this.sageGame.getPointsProgram(), this.sageGame.getGamePoints().dataRunningXpCategory.category, this.playerProfile.key)[0];
    }
    getLpXpAccount() {
        return this.userPoints.filter((account) => account.data.pointCategory.equals(this.sageGame.getGamePoints().lpCategory.category))[0];
    }
    getLpXpKey() {
        return points_1.UserPoints.findAddress(this.sageGame.getPointsProgram(), this.sageGame.getGamePoints().lpCategory.category, this.playerProfile.key)[0];
    }
}
exports.SagePlayer = SagePlayer;
