import { PublicKey } from "@solana/web3.js";
import { SectorCoordinates } from "../common/types";
import { FleetStateData } from "@staratlas/sage";
import { SageGame } from "./SageGame";

type CargoPod = {
    publicKey: PublicKey;
    loadedAmount: number;
    loadedResources: Map<string, number>;
    maxCapacity: number;
    fullLoad: boolean;
}

/* export class SageFleet {
    private sageGame: SageGame;

    label: string;
    publicKey: PublicKey;

    currentSector: SectorCoordinates;
    state: FleetStateData;

    cargoHold: CargoPod;
    fuelTank: CargoPod;
    ammoBank: CargoPod;

    constructor(sageGame: SageGame, fleetPublicKey: PublicKey) {
        this.sageGame = sageGame;
        this.publicKey = fleetPublicKey;
    }

    async update() {
        // TODO: implement
    }
} */