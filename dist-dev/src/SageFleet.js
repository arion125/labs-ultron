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
exports.SageFleet = exports.CargoPodType = void 0;
const anchor_1 = require("@staratlas/anchor");
const web3_js_1 = require("@solana/web3.js");
const sage_1 = require("@staratlas/sage");
const cargo_1 = require("@staratlas/cargo");
const data_source_1 = require("@staratlas/data-source");
const data_source_2 = require("@staratlas/data-source");
const SageGame_1 = require("./SageGame");
const spl_token_1 = require("@solana/spl-token");
const constants_1 = require("../common/constants");
var CargoPodType;
(function (CargoPodType) {
    CargoPodType["CargoHold"] = "CargoHold";
    CargoPodType["FuelTank"] = "FuelTank";
    CargoPodType["AmmoBank"] = "AmmoBank";
})(CargoPodType || (exports.CargoPodType = CargoPodType = {}));
class SageFleet {
    constructor(fleet, player) {
        this.onlyDataRunner = true;
        this.fleet = fleet;
        this.player = player;
        this.name = (0, data_source_1.byteArrayToString)(fleet.data.fleetLabel);
        this.key = fleet.key;
        this.stats = fleet.data.stats;
        this.movementStats = fleet.data.stats.movementStats;
        this.cargoStats = fleet.data.stats.cargoStats;
        this.state = fleet.state;
    }
    static init(fleet, player) {
        return __awaiter(this, void 0, void 0, function* () {
            const sageFleet = new SageFleet(fleet, player);
            const fuelTank = yield sageFleet.getCurrentCargoDataByType(CargoPodType.FuelTank);
            if (fuelTank.type !== "Success")
                throw new Error(fuelTank.type);
            const ammoBank = yield sageFleet.getCurrentCargoDataByType(CargoPodType.AmmoBank);
            if (ammoBank.type !== "Success")
                throw new Error(ammoBank.type);
            const cargoHold = yield sageFleet.getCurrentCargoDataByType(CargoPodType.CargoHold);
            if (cargoHold.type !== "Success")
                throw new Error(cargoHold.type);
            const [ships] = yield Promise.all([
                sageFleet.getShipsAccount()
            ]);
            if (ships.type !== "Success")
                throw new Error(ships.type);
            const currentSector = yield sageFleet.getCurrentSectorAsync();
            if (currentSector.type !== "Success")
                throw new Error(currentSector.type);
            sageFleet.fuelTank = fuelTank.data;
            sageFleet.ammoBank = ammoBank.data;
            sageFleet.cargoHold = cargoHold.data;
            sageFleet.ships = ships.data;
            sageFleet.onlyDataRunner = sageFleet.stats.miscStats.scanCost === 0;
            sageFleet.currentSector = currentSector.data;
            return sageFleet;
        });
    }
    getName() {
        return this.name;
    }
    getKey() {
        return this.key;
    }
    getSageGame() {
        return this.player.getSageGame();
    }
    getPlayer() {
        return this.player;
    }
    getStats() {
        return this.stats;
    }
    getMovementStats() {
        return this.movementStats;
    }
    getCargoStats() {
        return this.cargoStats;
    }
    getShips() {
        return this.ships;
    }
    getOnlyDataRunner() {
        return this.onlyDataRunner;
    }
    getCurrentState() {
        return this.state;
    }
    /** CARGO */
    getFuelTank() {
        return this.fuelTank;
    }
    getAmmoBank() {
        return this.ammoBank;
    }
    getCargoHold() {
        return this.cargoHold;
    }
    /* getResourceInCargoHoldByName(resourceName: ResourceName) {
        return this.cargoHold.loadedResources.filter((item) => item.mint.equals(this.getSageGame().getResourceMintByName(resourceName)))[0];
    } */
    /** END CARGO */
    getShipsAccount() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fetchShips = yield (0, data_source_1.readAllFromRPC)(this.getSageGame().getProvider().connection, this.getSageGame().getSageProgram(), sage_1.Ship, "confirmed");
                const ships = fetchShips.flatMap((ship) => ship.type === "ok" ? [ship.data] : []);
                if (ships.length === 0)
                    throw new Error();
                return { type: "Success", data: ships };
            }
            catch (e) {
                return { type: "ShipsNotFound" };
            }
        });
    }
    getCurrentSectorAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            let coordinates;
            // console.log("OK1")
            if (this.fleet.state.MoveWarp) {
                // console.log("OK2")
                coordinates = this.fleet.state.MoveWarp.toSector;
                return yield this.getSageGame().getSectorByCoordsAsync(coordinates);
            }
            if (this.fleet.state.MoveSubwarp) {
                coordinates = this.fleet.state.MoveSubwarp.currentSector;
                return yield this.getSageGame().getSectorByCoordsAsync(coordinates);
            }
            if (this.fleet.state.StarbaseLoadingBay) {
                const starbase = this.getSageGame().getStarbaseByKey(this.fleet.state.StarbaseLoadingBay.starbase);
                if (starbase.type !== "Success")
                    return starbase;
                coordinates = starbase.data.data.sector;
                return yield this.getSageGame().getSectorByCoordsAsync(coordinates);
            }
            if (this.fleet.state.Idle) {
                // console.log("OK3")
                coordinates = this.fleet.state.Idle.sector;
                return yield this.getSageGame().getSectorByCoordsAsync(coordinates);
            }
            if (this.fleet.state.Respawn) {
                coordinates = this.fleet.state.Respawn.sector;
                return yield this.getSageGame().getSectorByCoordsAsync(coordinates);
            }
            if (this.fleet.state.MineAsteroid) {
                const planet = this.getSageGame().getPlanetByKey(this.fleet.state.MineAsteroid.asteroid);
                if (planet.type !== "Success")
                    return planet;
                coordinates = planet.data.data.sector;
                return yield this.getSageGame().getSectorByCoordsAsync(coordinates);
            }
            return { type: "FleetSectorNotFound" };
        });
    }
    ;
    getCurrentSector() {
        return this.currentSector;
    }
    getCurrentCargoDataByType(type) {
        return __awaiter(this, void 0, void 0, function* () {
            const cargoPodType = type === CargoPodType.CargoHold ? this.fleet.data.cargoHold :
                type === CargoPodType.FuelTank ? this.fleet.data.fuelTank :
                    type === CargoPodType.AmmoBank ? this.fleet.data.ammoBank :
                        null;
            const cargoPodMaxCapacity = type === CargoPodType.CargoHold ? new anchor_1.BN(this.cargoStats.cargoCapacity) :
                type === CargoPodType.FuelTank ? new anchor_1.BN(this.cargoStats.fuelCapacity) :
                    type === CargoPodType.AmmoBank ? new anchor_1.BN(this.cargoStats.ammoCapacity) :
                        new anchor_1.BN(0);
            if (!cargoPodType || cargoPodMaxCapacity.eq(new anchor_1.BN(0)))
                return { type: "CargoPodTypeError" };
            const cargoPod = yield this.getCargoPodByKey(cargoPodType);
            if (cargoPod.type !== "Success")
                return cargoPod;
            const cargoPodTokenAccounts = yield this.getSageGame().getParsedTokenAccountsByOwner(cargoPod.data.key);
            if (cargoPodTokenAccounts.type !== "Success" || cargoPodTokenAccounts.data.length == 0) {
                const cpe = {
                    key: cargoPod.data.key,
                    loadedAmount: new anchor_1.BN(0),
                    resources: [],
                    maxCapacity: cargoPodMaxCapacity,
                    fullLoad: false,
                };
                return {
                    type: "CargoPodIsEmpty",
                    data: cpe
                };
            }
            const resources = [];
            for (const cargoPodTokenAccount of cargoPodTokenAccounts.data) {
                const cargoType = yield this.getSageGame().getCargoTypeByMintAsync(cargoPodTokenAccount.mint);
                if (cargoType.type !== "Success")
                    return cargoType;
                const resourceSpaceInCargoPerUnit = cargoType.data.stats[0];
                resources.push({
                    mint: cargoPodTokenAccount.mint,
                    amount: new anchor_1.BN(cargoPodTokenAccount.amount),
                    spaceInCargo: new anchor_1.BN(cargoPodTokenAccount.amount).mul(resourceSpaceInCargoPerUnit),
                    cargoTypeKey: cargoType.data.key,
                    tokenAccountKey: cargoPodTokenAccount.address,
                });
            }
            let loadedAmount = new anchor_1.BN(0);
            resources.forEach((item) => {
                loadedAmount = loadedAmount.add(item.spaceInCargo);
            });
            const cpe = {
                key: cargoPod.data.key,
                loadedAmount,
                resources,
                maxCapacity: cargoPodMaxCapacity,
                fullLoad: loadedAmount.eq(cargoPodMaxCapacity),
            };
            return {
                type: "Success",
                data: cpe
            };
        });
    }
    getCargoPodByKey(cargoPodKey) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cargoPodAccount = yield (0, data_source_2.readFromRPCOrError)(this.getSageGame().getProvider().connection, this.getSageGame().getCargoProgram(), cargoPodKey, cargo_1.CargoPod, "confirmed");
                return { type: "Success", data: cargoPodAccount };
            }
            catch (e) {
                return { type: "CargoPodNotFound" };
            }
        });
    }
    update() {
        return __awaiter(this, void 0, void 0, function* () {
            const fleet = yield this.player.getFleetByKeyAsync(this.fleet.key);
            if (fleet.type !== "Success")
                return fleet;
            const fuelTank = yield this.getCurrentCargoDataByType(CargoPodType.FuelTank);
            if (fuelTank.type !== "Success")
                return fuelTank;
            const ammoBank = yield this.getCurrentCargoDataByType(CargoPodType.AmmoBank);
            if (ammoBank.type !== "Success")
                return ammoBank;
            const cargoHold = yield this.getCurrentCargoDataByType(CargoPodType.CargoHold);
            if (cargoHold.type !== "Success")
                return cargoHold;
            const currentSector = yield this.getCurrentSectorAsync();
            if (currentSector.type !== "Success")
                return currentSector; // throw new Error(currentSector.type); ?
            this.fleet = fleet.data;
            this.state = fleet.data.state;
            this.fuelTank = fuelTank.data;
            this.ammoBank = ammoBank.data;
            this.cargoHold = cargoHold.data;
            this.currentSector = currentSector.data;
            yield this.getSageGame().delay(1000); // wait one seconds before updating the fleet
            return { type: "Success" };
        });
    }
    /** HELPERS */
    getTimeToWarpByCoords(coordinatesFrom, coordinatesTo) {
        const timeToWarp = sage_1.Fleet.calculateWarpTimeWithCoords(this.stats, coordinatesFrom, coordinatesTo);
        return timeToWarp;
    }
    getTimeToWarpBySector(sectorFrom, sectorTo) {
        const timeToWarp = sage_1.Fleet.calculateWarpTimeWithCoords(this.stats, sectorFrom.data.coordinates, sectorTo.data.coordinates);
        return timeToWarp;
    }
    getTimeToSubwarpByCoords(coordinatesFrom, coordinatesTo) {
        const timeToSubwarp = sage_1.Fleet.calculateSubwarpTimeWithCoords(this.stats, coordinatesFrom, coordinatesTo);
        return timeToSubwarp;
    }
    getTimeToSubwarpBySector(sectorFrom, sectorTo) {
        const timeToSubwarp = sage_1.Fleet.calculateSubwarpTimeWithCoords(this.stats, sectorFrom.data.coordinates, sectorTo.data.coordinates);
        return timeToSubwarp;
    }
    getTimeAndNeededResourcesToFullCargoInMining(minableResource) {
        const timeInSeconds = sage_1.Fleet.calculateAsteroidMiningResourceExtractionDuration(this.stats, minableResource.mineItem.data, minableResource.resource.data, this.cargoStats.cargoCapacity);
        const foodNeeded = Math.ceil(sage_1.Fleet.calculateAsteroidMiningFoodToConsume(this.stats, constants_1.MAX_AMOUNT, timeInSeconds));
        const ammoNeeded = Math.ceil(sage_1.Fleet.calculateAsteroidMiningAmmoToConsume(this.stats, constants_1.MAX_AMOUNT, timeInSeconds));
        const fuelNeeded = this.movementStats.planetExitFuelAmount;
        return { foodNeeded, ammoNeeded, fuelNeeded, timeInSeconds };
    }
    calculateSubwarpFuelBurnWithDistance(distance) {
        return sage_1.Fleet.calculateSubwarpFuelBurnWithDistance(this.stats, distance);
    }
    calculateWarpFuelBurnWithDistance(distance) {
        return sage_1.Fleet.calculateWarpFuelBurnWithDistance(this.stats, distance);
    }
    calculateWarpTimeWithDistance(distance) {
        return sage_1.Fleet.calculateWarpTime(this.stats, distance);
    }
    calculateSubwarpTimeWithDistance(distance) {
        return sage_1.Fleet.calculateSubwarpTime(this.stats, distance);
    }
    calculateRouteToSector(sectorFrom, sectorTo, movement) {
        if (sectorFrom.key.equals(sectorTo.key))
            return [[], 0];
        const route = movement === constants_1.MovementType.Warp ?
            this.createWarpRoute(sectorFrom, sectorTo) :
            movement === constants_1.MovementType.Subwarp ?
                [sectorFrom, sectorTo] : [];
        if (route.length === 0)
            return [route, 0];
        const fuelNeeded = movement === constants_1.MovementType.Warp ?
            (() => {
                return route.reduce((fuelNeeded, currentSector, i, sectors) => {
                    if (i === sectors.length - 1)
                        return fuelNeeded;
                    const nextSector = sectors[i + 1];
                    const sectorsDistanceGo = this.getSageGame().calculateDistanceBySector(currentSector, nextSector);
                    return fuelNeeded + this.calculateWarpFuelBurnWithDistance(sectorsDistanceGo);
                }, 0);
            })() : movement === constants_1.MovementType.Subwarp ?
            (() => {
                const sectorsDistanceGo = this.getSageGame().calculateDistanceBySector(route[0], route[1]);
                return this.calculateSubwarpFuelBurnWithDistance(sectorsDistanceGo);
            })() : 0;
        return [route, fuelNeeded];
    }
    /** END HELPERS */
    /** MOVEMENTS ROUTE */
    createWarpRoute(sectorFrom, sectorTo) {
        const start = { x: sectorFrom.data.coordinates[0].toNumber(), y: sectorFrom.data.coordinates[1].toNumber(), cost: 0, distance: 0, f: 0 };
        const goal = { x: sectorTo.data.coordinates[0].toNumber(), y: sectorTo.data.coordinates[1].toNumber(), cost: 0, distance: 0, f: 0 };
        const criticalPoints = this.aStarPathfindingWithRestStops(start, goal, this.getMovementStats().maxWarpDistance);
        const sectorRoute = [];
        criticalPoints.forEach(node => {
            const sector = this.getSageGame().getSectorByCoords([new anchor_1.BN(node.x), new anchor_1.BN(node.y)]);
            if (sector.type !== "Success")
                return;
            sectorRoute.push(sector.data);
        });
        if (criticalPoints.length !== sectorRoute.length)
            return [];
        return sectorRoute;
    }
    ;
    // Calcola la distanza euclidea tra due nodi
    euclideanDistance(a, b) {
        return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    }
    // Ricostruisce il percorso partendo dal nodo di arrivo
    reconstructPath(endNode) {
        const path = [];
        let currentNode = endNode;
        while (currentNode) {
            path.unshift(currentNode);
            if (!currentNode.parent)
                break;
            currentNode = currentNode.parent;
        }
        return path;
    }
    // Determina i punti di sosta lungo il percorso
    identifyRestStops(path, maxDistancePerSegment) {
        if (path.length === 0)
            return [];
        const restStops = [path[0]]; // Partenza sempre inclusa
        let lastRestStop = path[0];
        for (let i = 1; i < path.length; i++) {
            const segmentDistance = this.euclideanDistance(path[i], lastRestStop);
            if (segmentDistance > maxDistancePerSegment) {
                // Se la distanza dall'ultima sosta supera il massimo consentito, 
                // aggiungi l'ultimo nodo visitato prima di superare il limite come punto di sosta
                if (i > 1) { // Assicura di non aggiungere il punto di partenza due volte
                    restStops.push(path[i - 1]);
                    lastRestStop = path[i - 1]; // Aggiorna l'ultima sosta
                }
                // Dopo l'aggiunta del punto di sosta, verifica anche se il punto corrente deve essere una sosta
                // Ciò può accadere se la distanza dal punto di sosta appena aggiunto al punto corrente supera maxDistancePerSegment
                if (this.euclideanDistance(path[i], lastRestStop) > maxDistancePerSegment) {
                    restStops.push(path[i]);
                    lastRestStop = path[i]; // Aggiorna l'ultima sosta
                }
            }
        }
        // Assicura che il punto di arrivo sia sempre incluso come ultima sosta se non già presente
        if (!restStops.includes(path[path.length - 1])) {
            restStops.push(path[path.length - 1]);
        }
        return restStops;
    }
    // Implementazione dell'algoritmo A* con la logica per i punti di sosta
    aStarPathfindingWithRestStops(start, goal, maxDistancePerSegment) {
        const openSet = [start];
        const closedSet = [];
        start.distance = this.euclideanDistance(start, goal);
        start.f = start.distance;
        while (openSet.length > 0) {
            let current = openSet.reduce((prev, curr) => prev.f < curr.f ? prev : curr);
            if (current.x === goal.x && current.y === goal.y) {
                const path = this.reconstructPath(current);
                return this.identifyRestStops(path, maxDistancePerSegment);
            }
            openSet.splice(openSet.indexOf(current), 1);
            closedSet.push(current);
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0)
                        continue; // Salta il nodo corrente
                    const neighborX = current.x + dx;
                    const neighborY = current.y + dy;
                    // Verifica se il vicino è già stato esaminato
                    if (closedSet.some(node => node.x === neighborX && node.y === neighborY))
                        continue;
                    const tentativeGScore = current.cost + this.euclideanDistance(current, { x: neighborX, y: neighborY, cost: 0, distance: 0, f: 0 });
                    let neighbor = openSet.find(node => node.x === neighborX && node.y === neighborY);
                    if (!neighbor) {
                        neighbor = { x: neighborX, y: neighborY, cost: Infinity, distance: 0, f: 0 };
                        openSet.push(neighbor);
                    }
                    if (tentativeGScore >= neighbor.cost)
                        continue; // Questo non è un percorso migliore
                    // Questo percorso è il migliore finora. Memorizzalo!
                    neighbor.parent = current;
                    neighbor.cost = tentativeGScore;
                    neighbor.distance = this.euclideanDistance(neighbor, goal);
                    neighbor.f = neighbor.cost + neighbor.distance;
                }
            }
        }
        return []; // Nessun percorso trovato
    }
    /** END MOVEMENTS ROUTE */
    /** SAGE INSTRUCTIONS */
    /** CARGO */
    ixLoadCargo(resourceName, cargoPodType, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const update = yield this.update();
            if (update.type !== "Success")
                return { type: "FleetFailedToUpdate" };
            const ixs = [];
            const mint = this.getSageGame().getResourceMintByName(resourceName);
            const cargoType = yield this.getSageGame().getCargoTypeByMintAsync(mint);
            if (cargoType.type !== "Success")
                return cargoType;
            const resourceSpaceInCargoPerUnit = cargoType.data.stats[0];
            const fleetCurrentSector = yield this.getCurrentSectorAsync();
            if (fleetCurrentSector.type !== "Success")
                return fleetCurrentSector;
            const currentStarbase = this.getSageGame().getStarbaseBySector(fleetCurrentSector.data);
            if (currentStarbase.type !== "Success")
                return currentStarbase;
            const starbasePlayerPod = yield this.player.getStarbasePlayerPodAsync(currentStarbase.data);
            if (starbasePlayerPod.type !== "Success")
                return starbasePlayerPod;
            // console.log(starbasePlayerPod)
            const starbasePodMintAta = this.getSageGame().getAssociatedTokenAddressSync(starbasePlayerPod.data.key, mint);
            const starbasePodMintAtaBalance = yield this.getSageGame().getTokenAccountBalance(starbasePodMintAta);
            // console.log(starbasePodMintAtaBalance)
            const cargoHold = yield this.getCurrentCargoDataByType(cargoPodType);
            if (cargoHold.type !== "Success" && cargoHold.type !== "CargoPodIsEmpty")
                return cargoHold;
            const ixFleetCargoHoldMintAta = this.getSageGame().ixCreateAssociatedTokenAccountIdempotent(cargoHold.data.key, mint);
            try {
                yield (0, spl_token_1.getAccount)(this.getSageGame().getProvider().connection, ixFleetCargoHoldMintAta.address);
            }
            catch (e) {
                ixs.push(ixFleetCargoHoldMintAta.instruction);
            }
            // console.log(ixFleetCargoPodMintAta)
            // Calc the amount to deposit
            let amountToDeposit = anchor_1.BN.min(amount, cargoHold.data.loadedAmount.gt(new anchor_1.BN(0))
                ? cargoHold.data.maxCapacity.sub(cargoHold.data.loadedAmount)
                : cargoHold.data.maxCapacity);
            // console.log(cargoHold.data.loadedAmount.toNumber())
            amountToDeposit = amountToDeposit.div(resourceSpaceInCargoPerUnit);
            // console.log(amountToDeposit.toNumber())
            if (amountToDeposit.eq(new anchor_1.BN(0)))
                return { type: "FleetCargoPodIsFull" };
            amountToDeposit = anchor_1.BN.min(amountToDeposit, new anchor_1.BN(starbasePodMintAtaBalance));
            if (amountToDeposit.eq(new anchor_1.BN(0)))
                return { type: "StarbaseCargoIsEmpty" };
            // console.log(amountToDeposit.toNumber())
            const input = { keyIndex: 0, amount: amountToDeposit };
            const ix_1 = sage_1.Fleet.depositCargoToFleet(this.getSageGame().getSageProgram(), this.getSageGame().getCargoProgram(), this.getSageGame().getAsyncSigner(), this.player.getPlayerProfile().key, this.player.getProfileFactionAddress(), "funder", currentStarbase.data.key, this.player.getStarbasePlayerAddress(currentStarbase.data), this.fleet.key, starbasePlayerPod.data.key, cargoHold.data.key, this.getSageGame().getCargoTypeKeyByMint(mint), this.getSageGame().getCargoStatsDefinition().key, starbasePodMintAta, ixFleetCargoHoldMintAta.address, mint, this.getSageGame().getGame().key, this.getSageGame().getGameState().key, input);
            ixs.push(ix_1);
            return { type: "Success", ixs };
        });
    }
    ixUnloadCargo(resourceName, cargoPodType, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const update = yield this.update();
            if (update.type !== "Success")
                return { type: "FleetFailedToUpdate" };
            const ixs = [];
            const mint = this.getSageGame().getResourceMintByName(resourceName);
            const fleetCurrentSector = yield this.getCurrentSectorAsync();
            if (fleetCurrentSector.type !== "Success")
                return fleetCurrentSector;
            const currentStarbase = this.getSageGame().getStarbaseBySector(fleetCurrentSector.data);
            if (currentStarbase.type !== "Success")
                return currentStarbase;
            const starbasePlayerPod = yield this.player.getStarbasePlayerPodAsync(currentStarbase.data);
            if (starbasePlayerPod.type !== "Success")
                return starbasePlayerPod;
            // console.log(starbasePlayerPod)
            const ixStarbasePodMintAta = this.getSageGame().ixCreateAssociatedTokenAccountIdempotent(starbasePlayerPod.data.key, mint);
            try {
                yield (0, spl_token_1.getAccount)(this.getSageGame().getProvider().connection, ixStarbasePodMintAta.address);
            }
            catch (e) {
                ixs.push(ixStarbasePodMintAta.instruction);
            }
            // console.log(mintAtaKey)
            const cargoPod = yield this.getCurrentCargoDataByType(cargoPodType);
            if (cargoPod.type !== "Success" && cargoPod.type !== "CargoPodIsEmpty")
                return cargoPod;
            // console.log(cargoHold)
            const [fleetCargoPodResourceData] = cargoPod.data.resources.filter((item) => item.mint.equals(mint));
            if (!fleetCargoPodResourceData)
                return { type: "NoResourcesToWithdraw" };
            // console.log(mintAta)
            // Calc the amount to withdraw
            let amountToWithdraw = anchor_1.BN.min(amount, new anchor_1.BN(fleetCargoPodResourceData.amount));
            if (amountToWithdraw.eq(new anchor_1.BN(0)))
                return { type: "NoResourcesToWithdraw" };
            // console.log(amountToWithdraw.toNumber())
            const input = { keyIndex: 0, amount: amountToWithdraw };
            const ix_1 = sage_1.Fleet.withdrawCargoFromFleet(this.getSageGame().getSageProgram(), this.getSageGame().getCargoProgram(), this.getSageGame().getAsyncSigner(), "funder", this.player.getPlayerProfile().key, this.player.getProfileFactionAddress(), currentStarbase.data.key, this.player.getStarbasePlayerAddress(currentStarbase.data), this.fleet.key, cargoPod.data.key, starbasePlayerPod.data.key, this.getSageGame().getCargoTypeKeyByMint(mint), this.getSageGame().getCargoStatsDefinition().key, fleetCargoPodResourceData.tokenAccountKey, ixStarbasePodMintAta.address, mint, this.getSageGame().getGame().key, this.getSageGame().getGameState().key, input);
            ixs.push(ix_1);
            return { type: "Success", ixs };
        });
    }
    /** END CARGO */
    /** MINING */
    ixStartMining(resourceName) {
        return __awaiter(this, void 0, void 0, function* () {
            const update = yield this.update();
            if (update.type !== "Success")
                return { type: "FleetFailedToUpdate" };
            const ixs = [];
            const fleetCurrentSector = yield this.getCurrentSectorAsync();
            if (fleetCurrentSector.type !== "Success")
                return fleetCurrentSector;
            const currentStarbase = this.getSageGame().getStarbaseBySector(fleetCurrentSector.data);
            if (currentStarbase.type !== "Success")
                return currentStarbase;
            const starbasePlayerKey = this.player.getStarbasePlayerAddress(currentStarbase.data);
            const starbasePlayer = yield this.player.getStarbasePlayerByStarbaseAsync(currentStarbase.data);
            if (starbasePlayer.type !== "Success") {
                const ix_0 = sage_1.StarbasePlayer.registerStarbasePlayer(this.getSageGame().getSageProgram(), this.player.getProfileFactionAddress(), this.player.getSagePlayerProfileAddress(), currentStarbase.data.key, this.getSageGame().getGame().key, this.getSageGame().getGameState().key, currentStarbase.data.data.seqId);
                ixs.push(ix_0);
            }
            const currentPlanet = this.getSageGame().getPlanetsBySector(fleetCurrentSector.data, sage_1.PlanetType.AsteroidBelt);
            if (currentPlanet.type !== "Success")
                return currentPlanet;
            const mineableResource = this.getSageGame().getMineItemAndResourceByNameAndPlanetKey(resourceName, currentPlanet.data[0].key);
            const fuelTank = this.getFuelTank();
            const [fuelInTankData] = fuelTank.resources.filter((item) => item.mint.equals(this.getSageGame().getResourcesMint().Fuel));
            if (!fuelInTankData)
                return { type: "FleetCargoPodTokenAccountNotFound" };
            const input = { keyIndex: 0 };
            // Movement Handler
            const ix_movement = yield this.ixMovementHandler();
            if (ix_movement.type !== "Success")
                return ix_movement;
            if (ix_movement.ixs.length > 0)
                ixs.push(...ix_movement.ixs);
            const ix_1 = sage_1.Fleet.startMiningAsteroid(this.getSageGame().getSageProgram(), this.getSageGame().getAsyncSigner(), this.player.getPlayerProfile().key, this.player.getProfileFactionAddress(), this.fleet.key, currentStarbase.data.key, starbasePlayerKey, mineableResource.mineItem.key, mineableResource.resource.key, currentPlanet.data[0].key, this.getSageGame().getGameState().key, this.getSageGame().getGame().key, fuelInTankData.tokenAccountKey, input);
            ixs.push(ix_1);
            return { type: "Success", ixs };
        });
    }
    // FIX: I often get the 6087 (InvalidTime) error when trying to stop mining. Why?
    ixStopMining() {
        return __awaiter(this, void 0, void 0, function* () {
            const update = yield this.update();
            if (update.type !== "Success")
                return { type: "FleetFailedToUpdate" };
            const ixs = [];
            const fleetCurrentSector = yield this.getCurrentSectorAsync();
            if (fleetCurrentSector.type !== "Success")
                return fleetCurrentSector;
            const currentStarbase = this.getSageGame().getStarbaseBySector(fleetCurrentSector.data);
            if (currentStarbase.type !== "Success")
                return currentStarbase;
            if (!this.fleet.state.MineAsteroid)
                return { type: "FleetIsNotMiningAsteroid" };
            const planetKey = this.fleet.state.MineAsteroid.asteroid;
            const miningResourceKey = this.fleet.state.MineAsteroid.resource;
            const miningResource = this.getSageGame().getResourceByKey(miningResourceKey);
            if (miningResource.type !== "Success")
                return miningResource;
            const miningMineItem = this.getSageGame().getMineItemByKey(miningResource.data.data.mineItem);
            if (miningMineItem.type !== "Success")
                return miningMineItem;
            const miningMint = miningMineItem.data.data.mint;
            const cargoHold = this.getCargoHold();
            const ixFleetCargoHoldMintAta = this.getSageGame().ixCreateAssociatedTokenAccountIdempotent(cargoHold.key, miningMint);
            try {
                yield (0, spl_token_1.getAccount)(this.getSageGame().getProvider().connection, ixFleetCargoHoldMintAta.address);
            }
            catch (e) {
                ixs.push(ixFleetCargoHoldMintAta.instruction);
            }
            const [foodInCargoData] = cargoHold.resources.filter((item) => item.mint.equals(this.getSageGame().getResourcesMint().Food));
            if (!foodInCargoData)
                return { type: "FleetCargoPodTokenAccountNotFound" };
            const ammoBank = this.getAmmoBank();
            const [ammoInBankData] = ammoBank.resources.filter((item) => item.mint.equals(this.getSageGame().getResourcesMint().Ammo));
            if (!ammoInBankData)
                return { type: "FleetCargoPodTokenAccountNotFound" };
            const fuelTank = this.getFuelTank();
            const [fuelInTankData] = fuelTank.resources.filter((item) => item.mint.equals(this.getSageGame().getResourcesMint().Fuel));
            if (!fuelInTankData)
                return { type: "FleetCargoPodTokenAccountNotFound" };
            const miningResourceFrom = (0, spl_token_1.getAssociatedTokenAddressSync)(miningMint, miningMineItem.data.key, true);
            const ix_0 = sage_1.Fleet.asteroidMiningHandler(this.getSageGame().getSageProgram(), this.getSageGame().getCargoProgram(), this.fleet.key, currentStarbase.data.key, miningMineItem.data.key, miningResource.data.key, planetKey, this.fleet.data.cargoHold, this.fleet.data.ammoBank, this.getSageGame().getCargoTypeByResourceName(SageGame_1.ResourceName.Food), this.getSageGame().getCargoTypeByResourceName(SageGame_1.ResourceName.Ammo), this.getSageGame().getCargoTypeKeyByMint(miningMineItem.data.data.mint), this.getSageGame().getCargoStatsDefinition().key, this.getSageGame().getGameState().key, this.getSageGame().getGame().key, foodInCargoData.tokenAccountKey, ammoInBankData.tokenAccountKey, miningResourceFrom, ixFleetCargoHoldMintAta.address, this.getSageGame().getResourcesMint().Food, this.getSageGame().getResourcesMint().Ammo);
            ixs.push(ix_0);
            const input = { keyIndex: 0 };
            const ix_1 = sage_1.Fleet.stopMiningAsteroid(this.getSageGame().getSageProgram(), this.getSageGame().getCargoProgram(), this.getSageGame().getPointsProgram(), this.getSageGame().getAsyncSigner(), this.player.getPlayerProfile().key, this.player.getProfileFactionAddress(), this.fleet.key, miningMineItem.data.key, miningResource.data.key, planetKey, this.fleet.data.fuelTank, this.getSageGame().getCargoTypeByResourceName(SageGame_1.ResourceName.Fuel), this.getSageGame().getCargoStatsDefinition().key, this.player.getMiningXpKey(), this.getSageGame().getGamePoints().miningXpCategory.category, this.getSageGame().getGamePoints().miningXpCategory.modifier, this.player.getPilotXpKey(), this.getSageGame().getGamePoints().pilotXpCategory.category, this.getSageGame().getGamePoints().pilotXpCategory.modifier, this.player.getCouncilRankXpKey(), this.getSageGame().getGamePoints().councilRankXpCategory.category, this.getSageGame().getGamePoints().miningXpCategory.modifier, this.getSageGame().getGameState().key, this.getSageGame().getGame().key, fuelInTankData.tokenAccountKey, this.getSageGame().getResourcesMint().Fuel, input);
            ixs.push(ix_1);
            return { type: "Success", ixs };
        });
    }
    /** END MINING */
    /** TRAVEL */
    ixDockToStarbase() {
        return __awaiter(this, void 0, void 0, function* () {
            const update = yield this.update();
            if (update.type !== "Success")
                return { type: "FleetFailedToUpdate" };
            const ixs = [];
            const fleetCurrentSector = yield this.getCurrentSectorAsync();
            if (fleetCurrentSector.type !== "Success")
                return fleetCurrentSector;
            /* console.log(
              "FleetCurrentSector:",
              fleetCurrentSector.data.coordinates[0].toNumber(),
              fleetCurrentSector.data.coordinates[1].toNumber()
            ) */
            const currentStarbase = this.getSageGame().getStarbaseBySector(fleetCurrentSector.data);
            if (currentStarbase.type !== "Success")
                return currentStarbase;
            const starbasePlayerKey = this.player.getStarbasePlayerAddress(currentStarbase.data);
            const starbasePlayer = yield this.player.getStarbasePlayerByStarbaseAsync(currentStarbase.data);
            if (starbasePlayer.type !== "Success") {
                const ix_0 = sage_1.StarbasePlayer.registerStarbasePlayer(this.getSageGame().getSageProgram(), this.player.getProfileFactionAddress(), this.player.getSagePlayerProfileAddress(), currentStarbase.data.key, this.getSageGame().getGame().key, this.getSageGame().getGameState().key, currentStarbase.data.data.seqId);
                ixs.push(ix_0);
                const podSeedBuffer = web3_js_1.Keypair.generate().publicKey.toBuffer();
                const podSeeds = Array.from(podSeedBuffer);
                const cargoInput = {
                    keyIndex: 0,
                    podSeeds,
                };
                const ix_1 = sage_1.StarbasePlayer.createCargoPod(this.getSageGame().getSageProgram(), this.getSageGame().getCargoProgram(), starbasePlayerKey, this.getSageGame().getAsyncSigner(), this.player.getPlayerProfile().key, this.player.getProfileFactionAddress(), currentStarbase.data.key, this.getSageGame().getCargoStatsDefinition().key, this.getSageGame().getGame().key, this.getSageGame().getGameState().key, cargoInput);
                ixs.push(ix_1);
            }
            ;
            const input = 0;
            // Movement Handler
            const ix_movement = yield this.ixMovementHandler();
            if (ix_movement.type !== "Success")
                return ix_movement;
            if (ix_movement.ixs.length > 0)
                ixs.push(...ix_movement.ixs);
            const ix_2 = sage_1.Fleet.idleToLoadingBay(this.getSageGame().getSageProgram(), this.getSageGame().getAsyncSigner(), this.player.getPlayerProfile().key, this.player.getProfileFactionAddress(), this.fleet.key, currentStarbase.data.key, starbasePlayerKey, this.getSageGame().getGame().key, this.getSageGame().getGameState().key, input);
            ixs.push(ix_2);
            return { type: "Success", ixs };
        });
    }
    ixUndockFromStarbase() {
        return __awaiter(this, void 0, void 0, function* () {
            const update = yield this.update();
            if (update.type !== "Success")
                return { type: "FleetFailedToUpdate" };
            const ixs = [];
            const fleetCurrentSector = yield this.getCurrentSectorAsync();
            if (fleetCurrentSector.type !== "Success")
                return fleetCurrentSector;
            const currentStarbase = this.getSageGame().getStarbaseBySector(fleetCurrentSector.data);
            if (currentStarbase.type !== "Success")
                return currentStarbase;
            const starbasePlayerKey = this.player.getStarbasePlayerAddress(currentStarbase.data);
            const input = 0;
            const ix_1 = sage_1.Fleet.loadingBayToIdle(this.getSageGame().getSageProgram(), this.getSageGame().getAsyncSigner(), this.player.getPlayerProfile().key, this.player.getProfileFactionAddress(), this.fleet.key, currentStarbase.data.key, starbasePlayerKey, this.getSageGame().getGame().key, this.getSageGame().getGameState().key, input);
            ixs.push(ix_1);
            return { type: "Success", ixs };
        });
    }
    ixWarpToSector(sector, fuelNeeded) {
        return __awaiter(this, void 0, void 0, function* () {
            const update = yield this.update();
            if (update.type !== "Success")
                return { type: "FleetFailedToUpdate" };
            const ixs = [];
            const fuelMint = this.getSageGame().getResourceMintByName(SageGame_1.ResourceName.Fuel);
            const fuelTank = this.getFuelTank();
            const [fuelInTankData] = fuelTank.resources.filter((item) => item.mint.equals(fuelMint));
            if (!fuelInTankData)
                return { type: "FleetFuelTankIsEmpty" };
            if (fuelInTankData.amount.lt(fuelNeeded))
                return { type: "NoEnoughFuelToWarp" };
            const input = { keyIndex: 0, toSector: sector.data.coordinates };
            // Movement Handler
            const ix_movement = yield this.ixMovementHandler();
            if (ix_movement.type !== "Success")
                return ix_movement;
            if (ix_movement.ixs.length > 0)
                ixs.push(...ix_movement.ixs);
            const ix_0 = sage_1.Fleet.warpToCoordinate(this.getSageGame().getSageProgram(), this.getSageGame().getAsyncSigner(), this.player.getPlayerProfile().key, this.player.getProfileFactionAddress(), this.fleet.key, fuelTank.key, this.getSageGame().getCargoTypeKeyByMint(fuelMint), this.getSageGame().getCargoStatsDefinition().key, fuelInTankData.tokenAccountKey, fuelMint, this.getSageGame().getGameState().key, this.getSageGame().getGame().key, this.getSageGame().getCargoProgram(), input);
            ixs.push(ix_0);
            return { type: "Success", ixs };
        });
    }
    ixSubwarpToSector(sector, fuelNeeded) {
        return __awaiter(this, void 0, void 0, function* () {
            const update = yield this.update();
            if (update.type !== "Success")
                return { type: "FleetFailedToUpdate" };
            const ixs = [];
            const fuelMint = this.getSageGame().getResourceMintByName(SageGame_1.ResourceName.Fuel);
            const fuelTank = this.getFuelTank();
            const [fuelInTankData] = fuelTank.resources.filter((item) => item.mint.equals(fuelMint));
            if (!fuelInTankData)
                return { type: "FleetFuelTankIsEmpty" };
            if (new anchor_1.BN(fuelInTankData.tokenAccountKey).lt(fuelNeeded))
                return { type: "NoEnoughFuelToSubwarp" };
            const input = { keyIndex: 0, toSector: sector.data.coordinates };
            // Movement Handler
            const ix_movement = yield this.ixMovementHandler();
            if (ix_movement.type !== "Success")
                return ix_movement;
            if (ix_movement.ixs.length > 0)
                ixs.push(...ix_movement.ixs);
            const ix_0 = sage_1.Fleet.startSubwarp(this.getSageGame().getSageProgram(), this.getSageGame().getAsyncSigner(), this.player.getPlayerProfile().key, this.player.getProfileFactionAddress(), this.fleet.key, this.getSageGame().getGame().key, this.getSageGame().getGameState().key, input);
            ixs.push(ix_0);
            return { type: "Success", ixs };
        });
    }
    ixMovementHandler() {
        return __awaiter(this, void 0, void 0, function* () {
            const update = yield this.update();
            if (update.type !== "Success")
                return { type: "FleetFailedToUpdate" };
            const fuelMint = this.getSageGame().getResourceMintByName(SageGame_1.ResourceName.Fuel);
            const fuelTank = this.getFuelTank();
            const [fuelInTankData] = fuelTank.resources.filter((item) => item.mint.equals(fuelMint));
            if (!fuelInTankData || fuelInTankData.amount.eq(new anchor_1.BN(0)))
                return { type: "FleetFuelTankIsEmpty" };
            const ix_movement = this.fleet.state.MoveWarp ?
                [sage_1.Fleet.moveWarpHandler(this.getSageGame().getSageProgram(), this.getSageGame().getPointsProgram(), this.getPlayer().getPlayerProfile().key, this.key, this.player.getPilotXpKey(), this.getSageGame().getGamePoints().pilotXpCategory.category, this.getSageGame().getGamePoints().pilotXpCategory.modifier, this.player.getCouncilRankXpKey(), this.getSageGame().getGamePoints().councilRankXpCategory.category, this.getSageGame().getGamePoints().councilRankXpCategory.modifier, this.getSageGame().getGame().key)] : this.fleet.state.MoveSubwarp ?
                [sage_1.Fleet.movementSubwarpHandler(this.getSageGame().getSageProgram(), this.getSageGame().getCargoProgram(), this.getSageGame().getPointsProgram(), this.getPlayer().getPlayerProfile().key, this.key, fuelTank.key, this.getSageGame().getCargoTypeKeyByMint(fuelMint), this.getSageGame().getCargoStatsDefinition().key, fuelInTankData.tokenAccountKey, fuelMint, this.player.getPilotXpKey(), this.getSageGame().getGamePoints().pilotXpCategory.category, this.getSageGame().getGamePoints().pilotXpCategory.modifier, this.player.getCouncilRankXpKey(), this.getSageGame().getGamePoints().councilRankXpCategory.category, this.getSageGame().getGamePoints().councilRankXpCategory.modifier, this.getSageGame().getGame().key)] : [];
            return { type: "Success", ixs: ix_movement };
        });
    }
    /** END TRAVEL */
    /** SCANNING */
    ixScanForSurveyDataUnits() {
        return __awaiter(this, void 0, void 0, function* () {
            const update = yield this.update();
            if (update.type !== "Success")
                return { type: "FleetFailedToUpdate" };
            const ixs = [];
            const foodMint = this.getSageGame().getResourceMintByName(SageGame_1.ResourceName.Food);
            const sduMint = this.getSageGame().getResourceMintByName(SageGame_1.ResourceName.Sdu);
            const fleetCurrentSector = yield this.getCurrentSectorAsync();
            if (fleetCurrentSector.type !== "Success")
                return fleetCurrentSector;
            const cargoHold = this.getCargoHold();
            if (this.onlyDataRunner && cargoHold.fullLoad)
                return { type: "FleetCargoIsFull" };
            if (!this.onlyDataRunner) {
                const [foodInCargoData] = cargoHold.resources.filter((item) => item.mint.equals(foodMint));
                if (!foodInCargoData || foodInCargoData.amount.lt(new anchor_1.BN(this.stats.miscStats.scanCost)))
                    return { type: "NoEnoughFood" };
                if (cargoHold.fullLoad && !foodInCargoData.amount.eq(cargoHold.maxCapacity))
                    return { type: "FleetCargoIsFull" };
            }
            const sduTokenFrom = (0, spl_token_1.getAssociatedTokenAddressSync)(sduMint, this.getSageGame().getSuvreyDataUnitTracker().data.signer, true);
            const ixSduTokenTo = this.getSageGame().ixCreateAssociatedTokenAccountIdempotent(cargoHold.key, sduMint);
            try {
                yield (0, spl_token_1.getAccount)(this.getSageGame().getProvider().connection, ixSduTokenTo.address);
            }
            catch (e) {
                ixs.push(ixSduTokenTo.instruction);
            }
            const foodTokenFrom = (0, spl_token_1.getAssociatedTokenAddressSync)(foodMint, cargoHold.key, true);
            const input = { keyIndex: 0 };
            // Movement Handler
            const ix_movement = yield this.ixMovementHandler();
            if (ix_movement.type !== "Success")
                return ix_movement;
            if (ix_movement.ixs.length > 0)
                ixs.push(...ix_movement.ixs);
            const ix_0 = sage_1.SurveyDataUnitTracker.scanForSurveyDataUnits(this.getSageGame().getSageProgram(), this.getSageGame().getCargoProgram(), this.getSageGame().getPointsProgram(), this.getSageGame().getAsyncSigner(), this.player.getPlayerProfile().key, this.player.getProfileFactionAddress(), this.fleet.key, fleetCurrentSector.data.key, this.getSageGame().getSuvreyDataUnitTracker().key, cargoHold.key, this.getSageGame().getCargoTypeByResourceName(SageGame_1.ResourceName.Sdu), this.getSageGame().getCargoTypeByResourceName(SageGame_1.ResourceName.Food), this.getSageGame().getCargoStatsDefinition().key, sduTokenFrom, ixSduTokenTo.address, foodTokenFrom, foodMint, this.player.getDataRunningXpKey(), this.getSageGame().getGamePoints().dataRunningXpCategory.category, this.getSageGame().getGamePoints().dataRunningXpCategory.modifier, this.player.getCouncilRankXpKey(), this.getSageGame().getGamePoints().councilRankXpCategory.category, this.getSageGame().getGamePoints().councilRankXpCategory.modifier, this.getSageGame().getGame().key, this.getSageGame().getGameState().key, input);
            ixs.push(ix_0);
            return { type: "Success", ixs };
        });
    }
}
exports.SageFleet = SageFleet;
// !! usa più spesso createAssociatedTokenAccountIdempotent
// !! usa più spesso getAssociatedTokenAddressSync
