import { BN } from "@staratlas/anchor";
import { PublicKey } from "@solana/web3.js";
import { SectorCoordinates } from "../common/types";
import { CargoStats, DepositCargoToFleetInput, Fleet, FleetStateData, Sector } from "@staratlas/sage";
import { CargoType, CargoPod } from "@staratlas/cargo";
import { InstructionReturn, byteArrayToString } from "@staratlas/data-source";
import { SagePlayer } from "./SagePlayer";
import { readFromRPCOrError } from "@staratlas/data-source";
import { ResourceName } from "./SageGame";

type CargoPodLoadedResource = {
  cargoType: PublicKey;
  tokenAccount: PublicKey;
  amount: BN;
}

type CargoPodEnhanced = {
    key: PublicKey;
    statsDefinition: PublicKey;
    seqId: number;
    loadedAmount: number;
    loadedResources: Map<PublicKey, CargoPodLoadedResource>; // resource_mint: CargoPodLoadedResource
    maxCapacity: number;
    fullLoad: boolean;
}

enum CargoPodType {
    CargoHold = "CargoHold",
    FuelTank = "FuelTank",
    AmmoBank = "AmmoBank",
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

    // input: Fleet -> SageFleet is a Fleet class wrapper
    constructor(sageGame: SageGame, fleetPublicKey: PublicKey) {
        this.sageGame = sageGame;
        this.publicKey = fleetPublicKey;
    }

    async update() {
        // TODO: implement
    }
} */

export class SageFleet {

    private fleet!: Fleet;
    private player!: SagePlayer;

    name: string;
    key: PublicKey;
    fleetCargoStats: CargoStats;

    private constructor(fleet: Fleet, player: SagePlayer) {
        this.fleet = fleet;
        this.player = player;
        this.name = byteArrayToString(fleet.data.fleetLabel);
        this.key = fleet.key;
        this.fleetCargoStats = fleet.data.stats.cargoStats as CargoStats;
    }

    static async init(fleet: Fleet, player: SagePlayer): Promise<SageFleet> {
        return new SageFleet(fleet, player);
    }

    getSageGame() {
        return this.player.getSageGame();
    }

    getPlayer() {
        return this.player;
    }

    async getCurrentSectorAsync() { 
        await this.update();     
        let coordinates;

        if (this.fleet.state.MoveSubwarp) {
          coordinates = this.fleet.state.MoveSubwarp.currentSector as SectorCoordinates;
          return await this.getSageGame().getSectorByCoordsOrKeyAsync(coordinates);
        }
      
        if (this.fleet.state.StarbaseLoadingBay) {
          const starbase = this.getSageGame().getStarbaseByCoordsOrKey(this.fleet.state.StarbaseLoadingBay.starbase);
          if (starbase.type !== "Success") return starbase;

          coordinates = starbase.data.data.sector as SectorCoordinates;
          return await this.getSageGame().getSectorByCoordsOrKeyAsync(coordinates);
        }
      
        if (this.fleet.state.Idle) {
          coordinates = this.fleet.state.Idle.sector as SectorCoordinates;
          return await this.getSageGame().getSectorByCoordsOrKeyAsync(coordinates);
        }
      
        if (this.fleet.state.Respawn) {
          coordinates = this.fleet.state.Respawn.sector as SectorCoordinates;
          return await this.getSageGame().getSectorByCoordsOrKeyAsync(coordinates);
        }
      
        return { type: "FleetSectorNotFound" as const };
    };

    async getCurrentFleetStateAsync() {
      await this.update();
      return this.fleet.state;
    }

    async getCurrentCargoPodDataByType(type: CargoPodType) {
      await this.update();

      const cargoPodType = 
        type === CargoPodType.CargoHold ? this.fleet.data.cargoHold :
        type === CargoPodType.FuelTank ? this.fleet.data.fuelTank :
        type === CargoPodType.AmmoBank ? this.fleet.data.ammoBank :
        null;

      if (!cargoPodType) return { type: "CargoPodTypeNotFound" as const };

      const cargoPod = await this.getCargoPodByKey(cargoPodType);
      if (cargoPod.type !== "Success") return cargoPod;

      const cargoPodTokenAccounts = await this.getSageGame().getParsedTokenAccountsByOwner(cargoPod.data.key);
      if (cargoPodTokenAccounts.type !== "Success") return { 
        type: "CargoPodIsEmpty" as const,
        data: {
          key: cargoPod.data.key,
          statsDefinition: cargoPod.data.data.statsDefinition,
          seqId: cargoPod.data.data.seqId, // is this correct?
          loadedAmount: new BN(0),
          loadedResources: new Map(),
          maxCapacity: this.fleetCargoStats.cargoCapacity,
          fullLoad: false,
        } as CargoPodEnhanced 
      };

      const loadedResources = new Map<PublicKey, CargoPodLoadedResource>();
      cargoPodTokenAccounts.data.forEach((cargoPodTokenAccount) => {
        loadedResources.set(cargoPodTokenAccount.mint, {
          cargoType: CargoType.findAddress(
            this.getSageGame().getCargoProgram(),
            cargoPod.data.data.statsDefinition,
            cargoPodTokenAccount.mint,
            cargoPod.data.data.seqId
          )[0],
          tokenAccount: cargoPodTokenAccount.address,
          amount: new BN(cargoPodTokenAccount.amount)
        });
      });

      const loadedAmount = new BN(0);
      loadedResources.forEach((item) => {
        loadedAmount.add(item.amount);
      });

      return { 
        type: "Success" as const, 
        data: {
          key: cargoPod.data.key,
          statsDefinition: cargoPod.data.data.statsDefinition,
          seqId: cargoPod.data.data.seqId, // is this correct?
          loadedAmount: new BN(loadedAmount),
          loadedResources,
          maxCapacity: this.fleetCargoStats.cargoCapacity,
          fullLoad: loadedAmount.eq(new BN(this.fleetCargoStats.cargoCapacity)),
        } as CargoPodEnhanced 
      };
    }

    private async getCargoPodByKey(cargoPodKey: PublicKey) {
      try {
        const cargoPodAccount = await readFromRPCOrError(
          this.getSageGame().getProvider().connection,
          this.getSageGame().getCargoProgram(),
          cargoPodKey,
          CargoPod,
          "confirmed"
        );
        return { type: "Success" as const, data: cargoPodAccount };
      } catch (e) {
        return { type: "CargoPodNotFound" as const };
      }
    }

    private async update() {
        const fleet = await this.player.getFleetByKeyAsync(this.fleet.key);
        if (fleet.type !== "Success") return fleet;
        this.fleet = fleet.data;
    }

    /** SAGE INSTRUCTIONS */

    async ixLoadFuel(amount: BN) {
      const ixs: InstructionReturn[] = [];
      const fuelMint = this.getSageGame().getResourceMintByName(ResourceName.Fuel);

      const currentSector = await this.getCurrentSectorAsync();
      if (currentSector.type !== "Success") return currentSector;

      const currentStarbase = this.getSageGame().getStarbaseByCoordsOrKey(currentSector.data.data.coordinates as SectorCoordinates);
      if (currentStarbase.type !== "Success") return currentStarbase;

      const starbasePlayerPods = await this.getSageGame().getCargoPodsByAuthority(this.player.getStarbasePlayerAddress(currentStarbase.data));
      if (starbasePlayerPods.type !== "Success") return starbasePlayerPods;

      const starbasePlayerPodTokenAccounts = await this.getSageGame().getParsedTokenAccountsByOwner(starbasePlayerPods.data[0].key);
      if (starbasePlayerPodTokenAccounts.type !== "Success") return starbasePlayerPodTokenAccounts;

      const fuelStarbaseAta = starbasePlayerPodTokenAccounts.data.find(
        (tokenAccount) => tokenAccount.mint.toBase58() === fuelMint.toBase58()
      );
      if (!fuelStarbaseAta)
        return { type: "StarbaseCargoPodTokenAccountNotFound" as const };

      const fuelTank = await this.getCurrentCargoPodDataByType(CargoPodType.FuelTank);

      if (fuelTank.type !== "Success" && fuelTank.type !== "CargoPodIsEmpty") return fuelTank;
      const loadedResources = fuelTank.data.loadedResources.get(fuelMint);
      let fuelTankAta = loadedResources? loadedResources.tokenAccount : null;

      if (fuelTank.type === "CargoPodIsEmpty") {
        const ix_0 = this.getSageGame().ixCreateAssociatedTokenAccountIdempotent(fuelTank.data.key, fuelMint)
        ixs.push(ix_0.instruction);
        fuelTankAta = ix_0.address
      }

      if (!fuelTankAta) return { type: "FuelTankATAError" as const };

      // Calc the amount to deposit
      // ...

      const ix_1 = Fleet.depositCargoToFleet(
        this.getSageGame().getSageProgram(),
        this.getSageGame().getCargoProgram(),
        this.getSageGame().getAsyncSigner(),
        this.player.getPlayerProfile().key,
        this.player.getProfileFactionAddress(),
        "funder",
        currentStarbase.data.key,
        this.player.getStarbasePlayerAddress(currentStarbase.data),
        this.fleet.key,
        starbasePlayerPods.data[0].key,
        fuelTank.data.key,
        fuelTank.data.loadedResources.get(fuelMint)!.cargoType,
        fuelTank.data.statsDefinition,
        fuelStarbaseAta.address,
        fuelTankAta,
        fuelMint,
        this.getSageGame().getGame().key,
        this.getSageGame().getGameState().key,
        { keyIndex: 0, amount } as DepositCargoToFleetInput
      )
    }
}