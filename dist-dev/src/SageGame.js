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
exports.SageGame = exports.ResourceName = void 0;
const anchor_1 = require("@staratlas/anchor");
const web3_js_1 = require("@solana/web3.js");
const data_source_1 = require("@staratlas/data-source");
const player_profile_1 = require("@staratlas/player-profile");
const sage_1 = require("@staratlas/sage");
const profile_faction_1 = require("@staratlas/profile-faction");
const cargo_1 = require("@staratlas/cargo");
const crafting_1 = require("@staratlas/crafting");
const player_profile_2 = require("@staratlas/player-profile");
const data_source_2 = require("@staratlas/data-source");
const spl_token_1 = require("@solana/spl-token");
const constants_1 = require("../common/constants");
const points_1 = require("@staratlas/points");
var ResourceName;
(function (ResourceName) {
    ResourceName["Food"] = "Food";
    ResourceName["Ammo"] = "Ammo";
    ResourceName["Fuel"] = "Fuel";
    ResourceName["Tool"] = "Tool";
    ResourceName["Arco"] = "Arco";
    ResourceName["Biomass"] = "Biomass";
    ResourceName["Carbon"] = "Carbon";
    ResourceName["Diamond"] = "Diamond";
    ResourceName["Hydrogen"] = "Hydrogen";
    ResourceName["IronOre"] = "IronOre";
    ResourceName["CopperOre"] = "CopperOre";
    ResourceName["Lumanite"] = "Lumanite";
    ResourceName["Rochinol"] = "Rochinol";
    ResourceName["Sdu"] = "Sdu";
    ResourceName["EnergySubstrate"] = "EnergySubstrate";
    ResourceName["Electromagnet"] = "Electromagnet";
    ResourceName["Framework"] = "Framework";
    ResourceName["PowerSource"] = "PowerSource";
    ResourceName["ParticleAccelerator"] = "ParticleAccelerator";
    ResourceName["RadiationAbsorber"] = "RadiationAbsorber";
    ResourceName["SuperConductor"] = "SuperConductor";
    ResourceName["StrangeEmitter"] = "StrangeEmitter";
    ResourceName["CrystalLattice"] = "CrystalLattice";
    ResourceName["CopperWire"] = "CopperWire";
    ResourceName["Copper"] = "Copper";
    ResourceName["Electronics"] = "Electronics";
    ResourceName["Graphene"] = "Graphene";
    ResourceName["Hydrocarbon"] = "Hydrocarbon";
    ResourceName["Iron"] = "Iron";
    ResourceName["Magnet"] = "Magnet";
    ResourceName["Polymer"] = "Polymer";
    ResourceName["Steel"] = "Steel";
})(ResourceName || (exports.ResourceName = ResourceName = {}));
class SageGame {
    constructor(signer, connection, customPriorityFee) {
        this.resourcesMint = {
            [ResourceName.Food]: new web3_js_1.PublicKey("foodQJAztMzX1DKpLaiounNe2BDMds5RNuPC6jsNrDG"),
            [ResourceName.Ammo]: new web3_js_1.PublicKey("ammoK8AkX2wnebQb35cDAZtTkvsXQbi82cGeTnUvvfK"),
            [ResourceName.Fuel]: new web3_js_1.PublicKey("fueL3hBZjLLLJHiFH9cqZoozTG3XQZ53diwFPwbzNim"),
            [ResourceName.Tool]: new web3_js_1.PublicKey("tooLsNYLiVqzg8o4m3L2Uetbn62mvMWRqkog6PQeYKL"),
            [ResourceName.Arco]: new web3_js_1.PublicKey("ARCoQ9dndpg6wE2rRexzfwgJR3NoWWhpcww3xQcQLukg"),
            [ResourceName.Biomass]: new web3_js_1.PublicKey("MASS9GqtJz6ABisAxcUn3FeR4phMqH1XfG6LPKJePog"),
            [ResourceName.Carbon]: new web3_js_1.PublicKey("CARBWKWvxEuMcq3MqCxYfi7UoFVpL9c4rsQS99tw6i4X"),
            [ResourceName.Diamond]: new web3_js_1.PublicKey("DMNDKqygEN3WXKVrAD4ofkYBc4CKNRhFUbXP4VK7a944"),
            [ResourceName.Hydrogen]: new web3_js_1.PublicKey("HYDR4EPHJcDPcaLYUcNCtrXUdt1PnaN4MvE655pevBYp"),
            [ResourceName.IronOre]: new web3_js_1.PublicKey("FeorejFjRRAfusN9Fg3WjEZ1dRCf74o6xwT5vDt3R34J"),
            [ResourceName.CopperOre]: new web3_js_1.PublicKey("CUore1tNkiubxSwDEtLc3Ybs1xfWLs8uGjyydUYZ25xc"),
            [ResourceName.Lumanite]: new web3_js_1.PublicKey("LUMACqD5LaKjs1AeuJYToybasTXoYQ7YkxJEc4jowNj"),
            [ResourceName.Rochinol]: new web3_js_1.PublicKey("RCH1Zhg4zcSSQK8rw2s6rDMVsgBEWa4kiv1oLFndrN5"),
            [ResourceName.Sdu]: new web3_js_1.PublicKey("SDUsgfSZaDhhZ76U3ZgvtFiXsfnHbf2VrzYxjBZ5YbM"),
            [ResourceName.EnergySubstrate]: new web3_js_1.PublicKey("SUBSVX9LYiPrzHeg2bZrqFSDSKkrQkiCesr6SjtdHaX"),
            [ResourceName.Electromagnet]: new web3_js_1.PublicKey("EMAGoQSP89CJV5focVjrpEuE4CeqJ4k1DouQW7gUu7yX"),
            [ResourceName.Framework]: new web3_js_1.PublicKey("FMWKb7YJA5upZHbu5FjVRRoxdDw2FYFAu284VqUGF9C2"),
            [ResourceName.PowerSource]: new web3_js_1.PublicKey("PoWRYJnw3YDSyXgNtN3mQ3TKUMoUSsLAbvE8Ejade3u"),
            [ResourceName.ParticleAccelerator]: new web3_js_1.PublicKey("PTCLSWbwZ3mqZqHAporphY2ofio8acsastaHfoP87Dc"),
            [ResourceName.RadiationAbsorber]: new web3_js_1.PublicKey("RABSXX6RcqJ1L5qsGY64j91pmbQVbsYRQuw1mmxhxFe"),
            [ResourceName.SuperConductor]: new web3_js_1.PublicKey("CoNDDRCNxXAMGscCdejioDzb6XKxSzonbWb36wzSgp5T"),
            [ResourceName.StrangeEmitter]: new web3_js_1.PublicKey("EMiTWSLgjDVkBbLFaMcGU6QqFWzX9JX6kqs1UtUjsmJA"),
            [ResourceName.CrystalLattice]: new web3_js_1.PublicKey("CRYSNnUd7cZvVfrEVtVNKmXiCPYdZ1S5pM5qG2FDVZHF"),
            [ResourceName.CopperWire]: new web3_js_1.PublicKey("cwirGHLB2heKjCeTy4Mbp4M443fU4V7vy2JouvYbZna"),
            [ResourceName.Copper]: new web3_js_1.PublicKey("CPPRam7wKuBkYzN5zCffgNU17RKaeMEns4ZD83BqBVNR"),
            [ResourceName.Electronics]: new web3_js_1.PublicKey("ELECrjC8m9GxCqcm4XCNpFvkS8fHStAvymS6MJbe3XLZ"),
            [ResourceName.Graphene]: new web3_js_1.PublicKey("GRAPHKGoKtXtdPBx17h6fWopdT5tLjfAP8cDJ1SvvDn4"),
            [ResourceName.Hydrocarbon]: new web3_js_1.PublicKey("HYCBuSWCJ5ZEyANexU94y1BaBPtAX2kzBgGD2vES2t6M"),
            [ResourceName.Iron]: new web3_js_1.PublicKey("ironxrUhTEaBiR9Pgp6hy4qWx6V2FirDoXhsFP25GFP"),
            [ResourceName.Magnet]: new web3_js_1.PublicKey("MAGNMDeDJLvGAnriBvzWruZHfXNwWHhxnoNF75AQYM5"),
            [ResourceName.Polymer]: new web3_js_1.PublicKey("PoLYs2hbRt5iDibrkPT9e6xWuhSS45yZji5ChgJBvcB"),
            [ResourceName.Steel]: new web3_js_1.PublicKey("STEELXLJ8nfJy3P4aNuGxyNRbWPohqHSwxY75NsJRGG"),
        };
        this.customPriorityFee = { level: constants_1.PriorityLevel.Custom, value: 0 };
        this.connection = connection;
        this.provider = new anchor_1.AnchorProvider(connection, new anchor_1.Wallet(signer), anchor_1.AnchorProvider.defaultOptions());
        this.sageProgram = new anchor_1.Program(sage_1.SAGE_IDL, SageGame.SAGE_PROGRAM_ID, this.provider);
        this.playerProfileProgram = new anchor_1.Program(player_profile_1.PLAYER_PROFILE_IDL, SageGame.PLAYER_PROFILE_PROGRAM_ID, this.provider);
        this.profileFactionProgram = new anchor_1.Program(profile_faction_1.PROFILE_FACTION_IDL, SageGame.PROFILE_FACTION_PROGRAM_ID, this.provider);
        this.cargoProgram = new anchor_1.Program(cargo_1.CARGO_IDL, SageGame.CARGO_PROGRAM_ID, this.provider);
        this.craftingProgram = new anchor_1.Program(crafting_1.CRAFTING_IDL, SageGame.CRAFTING_PROGRAM_ID, this.provider);
        this.pointsProgram = new anchor_1.Program(points_1.POINTS_IDL, SageGame.POINTS_PROGRAM_ID, this.provider);
        this.funder = (0, data_source_2.keypairToAsyncSigner)(signer);
        this.customPriorityFee = customPriorityFee;
    }
    static init(signer, connection, customPriorityFee) {
        return __awaiter(this, void 0, void 0, function* () {
            const game = new SageGame(signer, connection, customPriorityFee);
            const [gameAndGameState, pointsCategories, cargoStatsDefinition, sectors, stars, planets, mineItems, resources, starbases, surveyDataUnitTracker] = yield Promise.all([
                game.getGameAndGameStateAccounts(),
                game.getPointsCategoriesAccount(),
                game.getCargoStatsDefinitionAccount(),
                game.getAllSectorsAccount(),
                game.getAllStarsAccount(),
                game.getAllPlanetsAccount(),
                game.getAllMineItems(),
                game.getAllResources(),
                game.getAllStarbasesAccount(),
                game.getSurveyDataUnitTrackerAccount()
            ]);
            if (gameAndGameState.type === "GameAndGameStateNotFound")
                throw new Error(gameAndGameState.type);
            if (pointsCategories.type === "PointsCategoriesNotFound")
                throw new Error(pointsCategories.type);
            if (cargoStatsDefinition.type === "CargoStatsDefinitionNotFound")
                throw new Error(cargoStatsDefinition.type);
            if (sectors.type === "SectorsNotFound")
                throw new Error(sectors.type);
            if (stars.type === "StarsNotFound")
                throw new Error(stars.type);
            if (planets.type === "PlanetsNotFound")
                throw new Error(planets.type);
            if (mineItems.type === "MineItemsNotFound")
                throw new Error(mineItems.type);
            if (resources.type === "ResourcesNotFound")
                throw new Error(resources.type);
            if (starbases.type === "StarbasesNotFound")
                throw new Error(starbases.type);
            if (surveyDataUnitTracker.type === "SurveyDataUnitTrackerNotFound")
                throw new Error(surveyDataUnitTracker.type);
            game.game = gameAndGameState.data.game;
            game.gameState = gameAndGameState.data.gameState;
            game.points = gameAndGameState.data.game.data.points;
            game.pointsCategories = pointsCategories.data;
            game.cargoStatsDefinition = cargoStatsDefinition.data;
            game.sectors = sectors.data;
            game.stars = stars.data;
            game.planets = planets.data;
            game.mineItems = mineItems.data;
            game.resources = resources.data;
            game.starbases = starbases.data;
            game.surveyDataUnitTracker = surveyDataUnitTracker.data;
            return game;
        });
    }
    getAsyncSigner() {
        return this.funder;
    }
    getPlayerPublicKey() {
        return this.funder.publicKey();
    }
    getConnection() {
        return this.connection;
    }
    getProvider() {
        return this.provider;
    }
    getSageProgram() {
        return this.sageProgram;
    }
    getPlayerProfileProgram() {
        return this.playerProfileProgram;
    }
    getPlayerProfileFactionProgram() {
        return this.profileFactionProgram;
    }
    getCargoProgram() {
        return this.cargoProgram;
    }
    getCraftingProgram() {
        return this.craftingProgram;
    }
    getPointsProgram() {
        return this.pointsProgram;
    }
    getResourcesMint() {
        return this.resourcesMint;
    }
    getResourcesMintNameByMint(mint) {
        for (const [key, publicKey] of Object.entries(this.resourcesMint)) {
            if (publicKey.equals(mint)) {
                return { type: "Success", data: key };
            }
        }
        return { type: "ResourceNotFound" };
    }
    /** GAME AND GAME STATE */
    // Game And Game State Accounts - fetch only one per game
    getGameAndGameStateAccounts() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [fetchGame] = yield (0, data_source_1.readAllFromRPC)(this.provider.connection, this.sageProgram, sage_1.Game, "confirmed");
                if (fetchGame.type !== "ok")
                    throw new Error();
                const fetchGameStates = yield this.getGameStatesAccount();
                if (fetchGameStates.type !== "Success")
                    throw new Error();
                const [gameStateAccount] = fetchGameStates.data.filter((gameState) => fetchGame.data.data.gameState.equals(gameState.key));
                if (!gameStateAccount)
                    throw new Error();
                return {
                    type: "Success",
                    data: {
                        game: fetchGame.data,
                        gameState: gameStateAccount
                    }
                };
            }
            catch (e) {
                return { type: "GameAndGameStateNotFound" };
            }
        });
    }
    getGame() {
        return this.game;
    }
    getGameState() {
        return this.gameState;
    }
    getGamePoints() {
        return this.points;
    }
    /** END GAME */
    /** GAME STATE */
    // !! Can be more than one game state account per game
    getGameStatesAccount() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fetchGameState = yield (0, data_source_1.readAllFromRPC)(this.provider.connection, this.sageProgram, sage_1.GameState, "confirmed");
                const gameStates = [];
                for (const gameState of fetchGameState) {
                    if (gameState.type !== "ok")
                        throw new Error();
                    gameStates.push(gameState.data);
                }
                return { type: "Success", data: gameStates };
            }
            catch (e) {
                return { type: "GameStatesNotFound" };
            }
        });
    }
    /** END GAME STATES */
    /** POINTS CATEGORY */
    // All Points Category Account - fetch only one per game
    getPointsCategoriesAccount() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fetchPointsCategories = yield (0, data_source_1.readAllFromRPC)(this.provider.connection, this.pointsProgram, points_1.PointsCategory, "confirmed");
                const pointsCategories = [];
                for (const pointsCategory of fetchPointsCategories) {
                    if (pointsCategory.type !== "ok")
                        throw new Error();
                    pointsCategories.push(pointsCategory.data);
                }
                return { type: "Success", data: pointsCategories };
            }
            catch (e) {
                return { type: "PointsCategoriesNotFound" };
            }
        });
    }
    getPointsCategories() {
        return this.pointsCategories;
    }
    /** END POINTS CATEGORY */
    /** CARGO STATS DEFINITION */
    // cargo Stats Definiton Account - fetch only one per game
    getCargoStatsDefinitionAccount() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [fetchCargoStatsDefinitionAccount] = yield (0, data_source_1.readAllFromRPC)(this.provider.connection, this.cargoProgram, cargo_1.CargoStatsDefinition, "confirmed");
                if (fetchCargoStatsDefinitionAccount.type !== "ok")
                    throw new Error();
                return { type: "Success", data: fetchCargoStatsDefinitionAccount.data };
            }
            catch (e) {
                return { type: "CargoStatsDefinitionNotFound" };
            }
        });
    }
    getCargoStatsDefinition() {
        return this.cargoStatsDefinition;
    }
    /** END CARGO STATS DEFINITION */
    /** SECTORS */
    // All Sectors Account - fetch only one per game
    getAllSectorsAccount() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fetchSectors = yield (0, data_source_1.readAllFromRPC)(this.provider.connection, this.sageProgram, sage_1.Sector, "confirmed");
                const sectors = fetchSectors.flatMap((sector) => sector.type === "ok" ? [sector.data] : []);
                if (sectors.length === 0)
                    throw new Error();
                return { type: "Success", data: sectors };
            }
            catch (e) {
                return { type: "SectorsNotFound" };
            }
        });
    }
    getSectors() {
        return this.sectors;
    }
    getSectorByCoordsAsync(sectorCoords) {
        return __awaiter(this, void 0, void 0, function* () {
            const [sectorKey] = sage_1.Sector.findAddress(this.sageProgram, this.game.key, sectorCoords);
            try {
                const sectorAccount = yield (0, data_source_1.readFromRPCOrError)(this.provider.connection, this.sageProgram, sectorKey, sage_1.Sector, "confirmed");
                return { type: "Success", data: sectorAccount };
            }
            catch (e) {
                return { type: "SectorNotFound" };
            }
        });
    }
    getSectorByKeyAsync(sectorKey) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sectorAccount = yield (0, data_source_1.readFromRPCOrError)(this.provider.connection, this.sageProgram, sectorKey, sage_1.Sector, "confirmed");
                return { type: "Success", data: sectorAccount };
            }
            catch (e) {
                return { type: "SectorNotFound" };
            }
        });
    }
    getSectorByCoords(sectorCoords) {
        const [sectorKey] = sage_1.Sector.findAddress(this.sageProgram, this.game.key, sectorCoords);
        const [sector] = this.sectors.filter((sector) => sector.key.equals(sectorKey));
        if (sector) {
            return { type: "Success", data: sector };
            ;
        }
        else {
            return { type: "SectorNotFound" };
        }
    }
    getSectorByKey(sectorKey) {
        const sector = this.sectors.find((sector) => sector.key.equals(sectorKey));
        if (sector) {
            return { type: "Success", data: sector };
            ;
        }
        else {
            return { type: "SectorNotFound" };
        }
    }
    /** END SECTORS */
    /** STARS */
    // All Stars Account - fetch only one per game
    getAllStarsAccount() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fetchStars = yield (0, data_source_1.readAllFromRPC)(this.provider.connection, this.sageProgram, sage_1.Star, "confirmed");
                const stars = fetchStars.flatMap((star) => star.type === "ok" ? [star.data] : []);
                if (stars.length === 0)
                    throw new Error();
                return { type: "Success", data: stars };
            }
            catch (e) {
                return { type: "StarsNotFound" };
            }
        });
    }
    getStars() {
        return this.stars;
    }
    /** END STARS */
    /** PLANETS */
    // All Planets Account - fetch only one per game
    getAllPlanetsAccount() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fetchPlanets = yield (0, data_source_1.readAllFromRPC)(this.provider.connection, this.sageProgram, sage_1.Planet, "confirmed");
                const planets = fetchPlanets.flatMap((planet) => planet.type === "ok" ? [planet.data] : []);
                if (planets.length === 0)
                    throw new Error();
                return { type: "Success", data: planets };
            }
            catch (e) {
                return { type: "PlanetsNotFound" };
            }
        });
    }
    getPlanets() {
        return this.planets;
    }
    getPlanetsByCoords(coordinates, planetType) {
        return this.planets.filter((planet) => !planetType ?
            this.bnArraysEqual(planet.data.sector, coordinates) :
            this.bnArraysEqual(planet.data.sector, coordinates) && planet.data.planetType === planetType);
    }
    getPlanetsBySector(sector, planetType) {
        const planets = this.getPlanetsByCoords(sector.data.coordinates, planetType);
        if (planets) {
            return { type: "Success", data: planets };
        }
        else {
            return { type: "PlanetsNotFound" };
        }
    }
    getPlanetByKey(planetKey) {
        const planet = this.planets.find((planet) => planet.key.equals(planetKey));
        if (planet) {
            return { type: "Success", data: planet };
            ;
        }
        else {
            return { type: "PlanetNotFound" };
        }
    }
    /** END PLANETS */
    /** STARBASES */
    // All Starbases - fetch only one per game
    getAllStarbasesAccount() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fetchStarbases = yield (0, data_source_1.readAllFromRPC)(this.provider.connection, this.sageProgram, sage_1.Starbase, "confirmed");
                const starbases = fetchStarbases.flatMap((starbase) => starbase.type === "ok" ? [starbase.data] : []);
                if (starbases.length === 0)
                    throw new Error();
                return { type: "Success", data: starbases };
            }
            catch (e) {
                return { type: "StarbasesNotFound" };
            }
        });
    }
    getStarbases() {
        return this.starbases;
    }
    getStarbasePrettyName(starbase) {
        const starbaseInfo = constants_1.starbasesInfo;
        const starbaseCoords = starbase.data.sector;
        const [sb] = starbaseInfo.filter((sb) => sb.coords[0].eq(starbaseCoords[0]) && sb.coords[1].eq(starbaseCoords[1]));
        if (!sb)
            return "";
        return sb.name;
    }
    getStarbaseBySectorAsync(sector) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sectorAccount = yield this.getSectorByKeyAsync(sector.key);
                if (sectorAccount.type === "SectorNotFound")
                    return sectorAccount.type;
                const pbk = sage_1.Starbase.findAddress(this.sageProgram, this.game.key, sectorAccount.data.data.coordinates)[0];
                const starbaseAccount = yield (0, data_source_1.readFromRPCOrError)(this.provider.connection, this.sageProgram, pbk, sage_1.Starbase, "confirmed");
                return { type: "Success", data: starbaseAccount };
            }
            catch (e) {
                return { type: "StarbaseNotFound" };
            }
        });
    }
    getStarbaseBySector(sector) {
        const sect = this.sectors.find((sect) => sect.key.equals(sector.key));
        if (sect) {
            const pbk = sage_1.Starbase.findAddress(this.sageProgram, this.game.key, sect.data.coordinates)[0];
            const starbase = this.starbases.find((starbase) => starbase.key.equals(pbk));
            if (starbase) {
                return { type: "Success", data: starbase };
            }
            else {
                return { type: "StarbaseNotFound" };
            }
        }
        else {
            return { type: "SectorNotFound" };
        }
    }
    getStarbaseByCoordsAsync(starbaseCoords) {
        return __awaiter(this, void 0, void 0, function* () {
            const [starbaseKey] = sage_1.Starbase.findAddress(this.sageProgram, this.game.key, starbaseCoords);
            try {
                const starbaseAccount = yield (0, data_source_1.readFromRPCOrError)(this.provider.connection, this.sageProgram, starbaseKey, sage_1.Starbase, "confirmed");
                return { type: "Success", data: starbaseAccount };
            }
            catch (e) {
                return { type: "StarbaseNotFound" };
            }
        });
    }
    getStarbaseByKeyAsync(starbaseKey) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const starbaseAccount = yield (0, data_source_1.readFromRPCOrError)(this.provider.connection, this.sageProgram, starbaseKey, sage_1.Starbase, "confirmed");
                return { type: "Success", data: starbaseAccount };
            }
            catch (e) {
                return { type: "StarbaseNotFound" };
            }
        });
    }
    getStarbaseByCoords(starbaseCoords) {
        const [starbaseKey] = sage_1.Starbase.findAddress(this.sageProgram, this.game.key, starbaseCoords);
        const starbase = this.starbases.find((starbase) => starbase.key.equals(starbaseKey));
        if (starbase) {
            return { type: "Success", data: starbase };
            ;
        }
        else {
            return { type: "StarbaseNotFound" };
        }
    }
    getStarbaseByKey(starbaseKey) {
        const starbase = this.starbases.find((starbase) => starbase.key.equals(starbaseKey));
        if (starbase) {
            return { type: "Success", data: starbase };
            ;
        }
        else {
            return { type: "StarbaseNotFound" };
        }
    }
    /** END STARBASES */
    /** MINE ITEMS */
    // Mine Item contains data about a resource in Sage (like hardness)
    // All Mine Items - fetch only one per game
    getAllMineItems() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fetchMineItems = yield (0, data_source_1.readAllFromRPC)(this.provider.connection, this.sageProgram, sage_1.MineItem, "confirmed");
                const mineItems = fetchMineItems.flatMap((mineItem) => mineItem.type === "ok" ? [mineItem.data] : []);
                if (mineItems.length === 0)
                    throw new Error();
                return { type: "Success", data: mineItems };
            }
            catch (e) {
                return { type: "MineItemsNotFound" };
            }
        });
    }
    getMineItems() {
        return this.mineItems;
    }
    getMineItemByKeyAsync(mineItemKey) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const mineItemAccount = yield (0, data_source_1.readFromRPCOrError)(this.provider.connection, this.sageProgram, mineItemKey, sage_1.MineItem, "confirmed");
                return { type: "Success", data: mineItemAccount };
            }
            catch (e) {
                return { type: "MineItemNotFound" };
            }
        });
    }
    getMineItemByKey(mineItemKey) {
        const mineItem = this.mineItems.find((mineItem) => mineItem.key.equals(mineItemKey));
        if (mineItem) {
            return { type: "Success", data: mineItem };
        }
        return { type: "MineItemNotFound" };
    }
    getMineItemAddressByMint(mint) {
        const [mineItem] = sage_1.MineItem.findAddress(this.sageProgram, this.game.key, mint);
        return mineItem;
    }
    /** END MINE ITEMS */
    /** RESOURCES */
    // Resource contains data about a resource in a planet (like richness or mining stats)
    getAllResources() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fetchResources = yield (0, data_source_1.readAllFromRPC)(this.provider.connection, this.sageProgram, sage_1.Resource, "confirmed");
                const resources = fetchResources.flatMap((resource) => resource.type === "ok" ? [resource.data] : []);
                if (resources.length === 0)
                    throw new Error();
                return { type: "Success", data: resources };
            }
            catch (e) {
                return { type: "ResourcesNotFound" };
            }
        });
    }
    getResources() {
        return this.resources;
    }
    getResourceByKeyAsync(resourceKey) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const resourceAccount = yield (0, data_source_1.readFromRPCOrError)(this.provider.connection, this.sageProgram, resourceKey, sage_1.Resource, "confirmed");
                return { type: "Success", data: resourceAccount };
            }
            catch (e) {
                return { type: "ResourceNotFound" };
            }
        });
    }
    getResourceByKey(resourceKey) {
        const resource = this.resources.find((resource) => resource.key.equals(resourceKey));
        if (resource) {
            return { type: "Success", data: resource };
        }
        return { type: "ResourceNotFound" };
    }
    getResourceByMineItemKeyAndPlanetKey(mineItem, planet) {
        const [resourceKey] = sage_1.Resource.findAddress(this.sageProgram, mineItem, planet);
        const resource = this.getResourceByKey(resourceKey);
        return resource;
    }
    getResourcesByPlanetAsync(planet) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fetchResources = yield (0, data_source_1.readAllFromRPC)(this.provider.connection, this.sageProgram, sage_1.Resource, "confirmed", [
                    {
                        memcmp: {
                            offset: 41,
                            bytes: planet.key.toBase58(),
                        },
                    },
                ]);
                const resources = fetchResources.flatMap((resource) => resource.type === "ok" ? [resource.data] : []);
                if (resources.length === 0)
                    throw new Error();
                return { type: "Success", data: resources };
            }
            catch (e) {
                return { type: "ResourcesNotFound" };
            }
        });
    }
    getResourcesByPlanet(planet) {
        const resources = this.resources.filter((resource) => resource.data.location.equals(planet.key));
        if (resources.length > 0) {
            return { type: "Success", data: resources };
        }
        return { type: "ResourcesNotFound" };
    }
    getResourceName(resource) {
        const mineItem = this.getMineItemByKey(resource.data.mineItem);
        if (mineItem.type !== "Success")
            return mineItem;
        return { type: "Success", data: (0, data_source_2.byteArrayToString)(mineItem.data.data.name) };
    }
    /** END RESOURCES */
    /** RESOURCES MINT */
    getResourceMintByName(resourceName) {
        return this.resourcesMint[resourceName];
    }
    getMineItemAndResourceByNameAndPlanetKey(resourceName, planetKey) {
        const mint = this.resourcesMint[resourceName];
        return this.getMineItemAndResourceByMintAndPlanetKey(mint, planetKey);
    }
    getMineItemAndResourceByMintAndPlanetKey(mint, planetKey) {
        const [mineItem] = this.mineItems.filter((mineItem) => mineItem.data.mint.equals(mint));
        const [resource] = this.resources.filter((resource) => resource.data.mineItem.equals(mineItem.key) && resource.data.location.equals(planetKey));
        return { mineItem, resource };
    }
    /** END RESOURCES MINT */
    /** SURVEY DATA UNIT TRACKER */
    getSurveyDataUnitTrackerAccount() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [fetchSurveyDataUnitTracker] = yield (0, data_source_1.readAllFromRPC)(this.provider.connection, this.sageProgram, sage_1.SurveyDataUnitTracker, "confirmed");
                if (fetchSurveyDataUnitTracker.type !== "ok")
                    throw new Error();
                return { type: "Success", data: fetchSurveyDataUnitTracker.data };
            }
            catch (e) {
                return { type: "SurveyDataUnitTrackerNotFound" };
            }
        });
    }
    getSuvreyDataUnitTracker() {
        return this.surveyDataUnitTracker;
    }
    /** END SURVEY DATA UNIT TRACKER */
    /** PLAYER PROFILE */
    // Step 1: Get Player Profiles from the player public key
    getPlayerProfilesAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fetchPlayerProfiles = yield (0, data_source_1.readAllFromRPC)(this.getProvider().connection, this.getPlayerProfileProgram(), player_profile_2.PlayerProfile, "confirmed", [
                    {
                        memcmp: {
                            offset: 30,
                            bytes: this.getPlayerPublicKey().toBase58(),
                        },
                    },
                ]);
                const playerProfiles = fetchPlayerProfiles.flatMap((playerProfile) => playerProfile.type === "ok" ? [playerProfile.data] : []);
                if (playerProfiles.length === 0)
                    throw new Error();
                return { type: "Success", data: playerProfiles };
            }
            catch (e) {
                return { type: "PlayerProfilesNotFound" };
            }
        });
    }
    // Step 2. Get a Player Profile Account
    getPlayerProfileAsync(playerProfilePublicKey) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const playerProfileAccount = yield (0, data_source_1.readFromRPCOrError)(this.getProvider().connection, this.getPlayerProfileProgram(), playerProfilePublicKey, player_profile_2.PlayerProfile, "confirmed");
                return { type: "Success", data: playerProfileAccount };
            }
            catch (e) {
                return { type: "PlayerProfileNotFound" };
            }
        });
    }
    /** END PLAYER PROFILE */
    /** FLEET */
    getFleetAddressByPlayerProfileAndFleetName(playerProfile, fleetName) {
        const fleetLabel = (0, data_source_1.stringToByteArray)(fleetName, 32);
        const [fleet] = sage_1.Fleet.findAddress(this.sageProgram, this.game.key, playerProfile, fleetLabel);
        return fleet;
    }
    getFleetAccountAsync(fleetPublicKey) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fleetAccount = yield (0, data_source_1.readFromRPCOrError)(this.provider.connection, this.sageProgram, fleetPublicKey, sage_1.Fleet, "confirmed");
                return { type: "Success", data: fleetAccount };
            }
            catch (e) {
                return { type: "FleetNotFound" };
            }
        });
    }
    /** END FLEET */
    /** HELPERS */
    getParsedTokenAccountsByOwner(owner) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield (0, data_source_2.getParsedTokenAccountsByOwner)(this.provider.connection, owner);
                return { type: "Success", data };
            }
            catch (e) {
                return { type: "ParsedTokenAccountError" };
            }
        });
    }
    ixCreateAssociatedTokenAccountIdempotent(owner, mint) {
        const associatedTokenAccount = (0, data_source_2.createAssociatedTokenAccountIdempotent)(mint, owner, true);
        const associatedTokenAccountKey = associatedTokenAccount.address;
        const associatedTokenAccountKeyIx = associatedTokenAccount.instructions;
        return { address: associatedTokenAccountKey, instruction: associatedTokenAccountKeyIx };
    }
    getCargoPodsByAuthority(authority) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fetchCargoPods = yield (0, sage_1.getCargoPodsByAuthority)(this.provider.connection, this.cargoProgram, authority);
                const cargoPods = fetchCargoPods.flatMap((pod) => pod.type === "ok" ? [pod.data] : []);
                if (cargoPods.length == 0)
                    return { type: "CargoPodsNotFound" };
                return { type: "Success", data: cargoPods };
            }
            catch (e) {
                return { type: "CargoPodsNotFound" };
            }
        });
    }
    // !! we can just return the balance (also if the ATA doesn't exist) thanks to createTokenAccountIdempotent instruction
    getTokenAccountBalance(tokenAccounKey) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tokenAccount = yield this.connection.getTokenAccountBalance(tokenAccounKey, 'confirmed');
                if (tokenAccount.value.uiAmount == null) {
                    //return { type: "TokenAccountShouldBeDefined" as const };
                    return 0;
                }
                else {
                    // return { type: "Success" as const, data: tokenAccount.value.uiAmount };
                    return tokenAccount.value.uiAmount;
                }
            }
            catch (e) {
                return 0;
            }
        });
    }
    ;
    bnArraysEqual(a, b) {
        if (a.length !== b.length)
            return false;
        for (let i = 0; i < a.length; i++) {
            if (!a[i].eq(b[i]))
                return false;
        }
        return true;
    }
    getCargoTypeKeyByMint(mint) {
        const [cargoType] = cargo_1.CargoType.findAddress(this.cargoProgram, this.cargoStatsDefinition.key, mint, this.cargoStatsDefinition.data.seqId);
        return cargoType;
    }
    getCargoTypeByMintAsync(mint) {
        return __awaiter(this, void 0, void 0, function* () {
            const cargoTypeKey = this.getCargoTypeKeyByMint(mint);
            try {
                const cargoTypeAccount = yield (0, data_source_1.readFromRPCOrError)(this.provider.connection, this.cargoProgram, cargoTypeKey, cargo_1.CargoType, "confirmed");
                return { type: "Success", data: cargoTypeAccount };
            }
            catch (e) {
                return { type: "CargoTypeNotFound" };
            }
        });
    }
    getCargoTypeByResourceName(resourceName) {
        const mint = this.resourcesMint[resourceName];
        const [cargoType] = cargo_1.CargoType.findAddress(this.cargoProgram, this.cargoStatsDefinition.key, mint, this.cargoStatsDefinition.data.seqId);
        return cargoType;
    }
    calculateDistanceByCoords(a, b) {
        return (0, sage_1.calculateDistance)(a, b);
    }
    calculateDistanceBySector(a, b) {
        return (0, sage_1.calculateDistance)(a.data.coordinates, b.data.coordinates);
    }
    getAssociatedTokenAddressSync(owner, mint) {
        return (0, spl_token_1.getAssociatedTokenAddressSync)(mint, owner, true);
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /** END HELPERS */
    /** TRANSACTIONS */
    ixBurnQuattrinoToken() {
        const fromATA = (0, spl_token_1.getAssociatedTokenAddressSync)(constants_1.quattrinoTokenPubkey, this.funder.publicKey());
        const ix = (0, spl_token_1.createBurnInstruction)(fromATA, constants_1.quattrinoTokenPubkey, this.funder.publicKey(), 1);
        const iws = (funder) => __awaiter(this, void 0, void 0, function* () {
            return ({
                instruction: ix,
                signers: [funder],
            });
        });
        return iws;
    }
    getQuattrinoBalance() {
        return __awaiter(this, void 0, void 0, function* () {
            const fromATA = (0, spl_token_1.getAssociatedTokenAddressSync)(constants_1.quattrinoTokenPubkey, this.funder.publicKey());
            const tokenBalance = yield this.getTokenAccountBalance(fromATA);
            if (tokenBalance === 0)
                return { type: "NoEnoughTokensToPerformLabsAction" };
            return { type: "Success", data: tokenBalance };
        });
    }
    buildDynamicTransactions(instructions, fee) {
        return __awaiter(this, void 0, void 0, function* () {
            if (fee) {
                const tokenBalance = yield this.getQuattrinoBalance();
                if (tokenBalance.type !== "Success")
                    return tokenBalance;
                instructions.push(this.ixBurnQuattrinoToken());
            }
            const getFee = (writableAccounts, connection) => __awaiter(this, void 0, void 0, function* () {
                if (this.customPriorityFee.level === constants_1.PriorityLevel.None)
                    return 0;
                const customPriorityFee = this.customPriorityFee.level === constants_1.PriorityLevel.Default ? constants_1.PriorityLevelValue.Default :
                    this.customPriorityFee.level === constants_1.PriorityLevel.Low ? constants_1.PriorityLevelValue.Low :
                        this.customPriorityFee.level === constants_1.PriorityLevel.Medium ? constants_1.PriorityLevelValue.Medium :
                            this.customPriorityFee.level === constants_1.PriorityLevel.High ? constants_1.PriorityLevelValue.High :
                                (this.customPriorityFee.level === constants_1.PriorityLevel.Custom &&
                                    this.customPriorityFee.value &&
                                    this.customPriorityFee.value < constants_1.PriorityLevelValue.MaxCustom) ? this.customPriorityFee.value :
                                    0;
                const rpf = yield connection.getRecentPrioritizationFees({ lockedWritableAccounts: writableAccounts });
                const priorityFee = Math.round(rpf.map(item => item.prioritizationFee).reduce((acc, fee) => acc + fee, 0) / rpf.length) + customPriorityFee;
                // console.log("\nPriority Fee:", priorityFee / 1000000, "Lamports per CU");
                return priorityFee;
            });
            const getLimit = (transaction, connection) => __awaiter(this, void 0, void 0, function* () {
                const unitLimit = ((yield (0, data_source_2.getSimulationUnits)(transaction, connection)) || 100000) + 1000;
                // console.log("\nUnit Limit:", unitLimit, "CU");
                return unitLimit;
            });
            const txs = yield (0, data_source_2.buildOptimalDynamicTransactions)(this.connection, instructions, this.funder, {
                getFee,
                getLimit,
            });
            if (txs.isErr())
                return { type: "BuildOptimalDynamicTransactionsFailed" };
            return { type: "Success", data: txs.value };
        });
    }
    /* async sendDynamicTransactions(instructions: InstructionReturn[], fee: boolean) {
      const commitment: Finality = "confirmed";
      let attempts = 0;
      const maxAttempts = 3;
      const txSignatures: string[] = [];
      
      let buildTxs = await this.buildDynamicTransactions(instructions, fee);
      if (buildTxs.type !== "Success") return buildTxs;
      
      let toProcess = buildTxs.data;
    
      while (toProcess.length > 0 && attempts < maxAttempts) {
        const results = await Promise.allSettled(
          toProcess.map(tx => sendTransaction(tx, this.connection, {
            commitment,
            sendOptions: {
              skipPreflight: false,
              preflightCommitment: "confirmed",
            },
          }))
        );
    
        toProcess = [];
    
        console.log(" ");
        results.forEach(async (result, index) => {
          if (result.status === "rejected") {
            let reason;

            const errorCode = result.reason && result.reason.message ? parseInt(result.reason.message.split(" ").pop().trim()) : null;
            if (errorCode && errorCode >= 6000 && result.reason.logs && result.reason.logs.length > 6) {
              const errorMessage: string[] = result.reason.logs[6].split(".");
              reason = errorMessage.slice(1, errorMessage.length - 1).map(item => item.trim()).join(" - ");
            } else {
              const error = result.reason as SolanaJSONRPCError
              reason = error.message[error.message.length - 1];
            }

            console.error(`Transaction #${index} failed on attempt ${attempts + 1} with error: ${reason}`);

            if (buildTxs.type === "Success")
              toProcess.push(buildTxs.data[index]);
          } else if (result.status === "fulfilled" && !result.value.value.isOk()) {
            console.error(`Transaction #${index} completed but not OK, retrying...`);
            
            buildTxs = await this.buildDynamicTransactions(instructions, fee);
            if (buildTxs.type !== "Success") return buildTxs;

            toProcess.push(buildTxs.data[index]);
          } else if (result.status === "fulfilled" && result.value.value.isOk()){
            console.log(`Transaction #${index} completed!`);
            txSignatures.push(result.value.value.value);
          }
        });
    
        attempts++;
        if (toProcess.length > 0) {
          console.log(" ");
          console.log("Waiting 10 seconds before next attempt...");
          await this.delay(10000);
        }
      }
    
      if (txSignatures.length === buildTxs.data.length) {
        return { type: "Success" as const, data: txSignatures };
      } else {
        return { type: "SendTransactionsFailure" as const };
      }
    } */
    buildAndSendDynamicTransactions(instructions, fee) {
        return __awaiter(this, void 0, void 0, function* () {
            const COMMITMENT = "confirmed";
            const MAX_ATTEMPTS = 10;
            const RETRY_DELAY_MS = 10000;
            let attempts = 0;
            const txSignatures = [];
            // Build transactions
            let buildTxs = yield this.buildDynamicTransactions(instructions, fee);
            if (buildTxs.type !== "Success")
                return buildTxs;
            let toProcess = buildTxs.data;
            while (toProcess.length > 0 && attempts < MAX_ATTEMPTS) {
                // Process transactions
                const results = yield this.sendAllTransactions(toProcess, COMMITMENT);
                toProcess = [];
                // Check transactions results
                for (let i = 0; i < results.length; i++) {
                    const result = results[i];
                    // If transaction failed to send
                    if (result.status === "rejected") {
                        const reason = this.parseError(result.reason);
                        console.error(`> Transaction #${i} failed on attempt ${attempts + 1}: ${reason}`);
                        const newBuild = yield this.buildDynamicTransactions(instructions, fee);
                        if (newBuild.type === "Success") {
                            toProcess.push(newBuild.data[i]);
                        }
                        else {
                            console.error(`> Failed to rebuild transaction #${i}`);
                        }
                    }
                    // If transaction sent, confirmed but not OK
                    else if (result.status === "fulfilled" && !result.value.value.isOk()) {
                        console.error(`> Transaction #${i} completed but not OK, rebuilding and retrying...`);
                        const newBuild = yield this.buildDynamicTransactions(instructions, fee);
                        if (newBuild.type === "Success") {
                            toProcess.push(newBuild.data[i]);
                        }
                        else {
                            console.error(`> Failed to rebuild transaction #${i}`);
                        }
                    }
                    // If transaction sent, confirmed and OK
                    else if (result.status === "fulfilled" && result.value.value.isOk()) {
                        console.log(`> Transaction #${i} completed!`);
                        txSignatures.push(result.value.value.value);
                    }
                }
                attempts++;
                if (toProcess.length > 0 && attempts < MAX_ATTEMPTS) {
                    console.log(`\nWaiting ${RETRY_DELAY_MS / 1000} seconds for next attempt...`);
                    yield this.delay(RETRY_DELAY_MS);
                }
            }
            return txSignatures.length === buildTxs.data.length
                ? { type: "Success", data: txSignatures }
                : { type: "SendTransactionsFailure" };
        });
    }
    sendAllTransactions(transactions, commitment) {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.allSettled(transactions.map(tx => (0, data_source_2.sendTransaction)(tx, this.connection, { commitment })));
        });
    }
    parseError(reason) {
        const errorCode = reason ? parseInt(reason.message.split(" ").pop().trim()) : null;
        if (errorCode && errorCode >= 6000 /*  && reason.logs && reason.logs.length > 6 */) {
            const [error] = Object.values(sage_1.sageErrorMap).filter(item => item.code == errorCode);
            return error ? error.msg : reason;
            /* const errorMessage: string[] = reason.logs[6].split(".");
            return errorMessage.slice(1, errorMessage.length - 1).map(item => item.trim()).join(" - "); */
        }
        else {
            return reason;
        }
    }
}
exports.SageGame = SageGame;
SageGame.SAGE_PROGRAM_ID = new web3_js_1.PublicKey("SAGE2HAwep459SNq61LHvjxPk4pLPEJLoMETef7f7EE");
SageGame.PLAYER_PROFILE_PROGRAM_ID = new web3_js_1.PublicKey("pprofELXjL5Kck7Jn5hCpwAL82DpTkSYBENzahVtbc9");
SageGame.PROFILE_FACTION_PROGRAM_ID = new web3_js_1.PublicKey("pFACSRuobDmvfMKq1bAzwj27t6d2GJhSCHb1VcfnRmq");
// static readonly PROFILE_VAULT_PROGRAM_ID = new PublicKey("pv1ttom8tbyh83C1AVh6QH2naGRdVQUVt3HY1Yst5sv");
SageGame.CARGO_PROGRAM_ID = new web3_js_1.PublicKey("Cargo2VNTPPTi9c1vq1Jw5d3BWUNr18MjRtSupAghKEk");
SageGame.CRAFTING_PROGRAM_ID = new web3_js_1.PublicKey("CRAFT2RPXPJWCEix4WpJST3E7NLf79GTqZUL75wngXo5");
SageGame.POINTS_PROGRAM_ID = new web3_js_1.PublicKey("Point2iBvz7j5TMVef8nEgpmz4pDr7tU7v3RjAfkQbM");
