import { BN } from "@staratlas/anchor";
import { PublicKey } from "@solana/web3.js";
import { SectorCoordinates } from "../common/types";
import { CargoStats, DepositCargoToFleetInput, Fleet, FleetStateData, MovementStats, PlanetType, Sector, ShipStats, StartMiningAsteroidInput, StartSubwarpInput, WarpToCoordinateInput, WithdrawCargoFromFleetInput } from "@staratlas/sage";
import { CargoType, CargoPod } from "@staratlas/cargo";
import { InstructionReturn, byteArrayToString } from "@staratlas/data-source";
import { SagePlayer } from "./SagePlayer";
import { readFromRPCOrError } from "@staratlas/data-source";
import { ResourceName } from "./SageGame";
import { Account } from "@solana/spl-token";

/* type CargoPodLoadedResource = {
  cargoType: PublicKey;
  tokenAccount: Account;
  amount: BN;
} */

type CargoPodEnhanced = {
    key: PublicKey;
    loadedAmount: number;
    loadedResources: Map<string, Account>; // resource_mint: CargoPodLoadedResource
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
    fleetStats: ShipStats;
    fleetMovementStats: MovementStats;
    fleetCargoStats: CargoStats;

    private constructor(fleet: Fleet, player: SagePlayer) {
        this.fleet = fleet;
        this.player = player;
        this.name = byteArrayToString(fleet.data.fleetLabel);
        this.key = fleet.key;
        this.fleetStats = fleet.data.stats as ShipStats;
        this.fleetMovementStats = fleet.data.stats.movementStats as MovementStats;
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
          return await this.getSageGame().getSectorByCoordsAsync(coordinates);
        }
      
        if (this.fleet.state.StarbaseLoadingBay) {
          const starbase = this.getSageGame().getStarbaseByKey(this.fleet.state.StarbaseLoadingBay.starbase);
          if (starbase.type !== "Success") return starbase;

          coordinates = starbase.data.data.sector as SectorCoordinates;
          return await this.getSageGame().getSectorByCoordsAsync(coordinates);
        }
      
        if (this.fleet.state.Idle) {
          coordinates = this.fleet.state.Idle.sector as SectorCoordinates;
          return await this.getSageGame().getSectorByCoordsAsync(coordinates);
        }
      
        if (this.fleet.state.Respawn) {
          coordinates = this.fleet.state.Respawn.sector as SectorCoordinates;
          return await this.getSageGame().getSectorByCoordsAsync(coordinates);
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

      if (cargoPodTokenAccounts.type !== "Success" || cargoPodTokenAccounts.data.length == 0) { 
        const cpe: CargoPodEnhanced = {
          key: cargoPod.data.key,
          loadedAmount: new BN(0),
          loadedResources: new Map(),
          maxCapacity: this.fleetCargoStats.cargoCapacity,
          fullLoad: false,
        }
        return { 
          type: "CargoPodIsEmpty" as const,
          data: cpe
        };
      }

      const loadedResources = new Map<string, Account>();
      cargoPodTokenAccounts.data.forEach((cargoPodTokenAccount) => {
        loadedResources.set(cargoPodTokenAccount.mint.toBase58(), cargoPodTokenAccount);
      });

      let loadedAmount = new BN(0);
      loadedResources.forEach((item) => {
        loadedAmount = loadedAmount.add(new BN(item.amount));
      });

      const cpe: CargoPodEnhanced = {
        key: cargoPod.data.key,
        loadedAmount,
        loadedResources,
        maxCapacity: this.fleetCargoStats.cargoCapacity,
        fullLoad: loadedAmount.eq(new BN(this.fleetCargoStats.cargoCapacity)),
      }

      return { 
        type: "Success" as const, 
        data: cpe
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

    /** HELPERS */
    private getTimeToWarpByCoords(coordinatesFrom: [BN, BN], coordinatesTo: [BN, BN]) {
      const timeToWarp = Fleet.calculateWarpTimeWithCoords(
        this.fleetStats,
        coordinatesFrom,
        coordinatesTo
      );

      return timeToWarp;
    }

    getTimeToWarpBySector(sectorFrom: Sector, sectorTo: Sector) {
      const timeToWarp = Fleet.calculateWarpTimeWithCoords(
        this.fleetStats,
        sectorFrom.data.coordinates as [BN, BN],
        sectorTo.data.coordinates as [BN, BN]
      );

      return timeToWarp;
    }

    private getTimeToSubwarpByCoords(coordinatesFrom: [BN, BN], coordinatesTo: [BN, BN]) {
      const timeToSubwarp = Fleet.calculateSubwarpTimeWithCoords(
        this.fleetStats,
        coordinatesFrom,
        coordinatesTo
      );

      return timeToSubwarp;
    }

    getTimeToSubwarpBySector(sectorFrom: Sector, sectorTo: Sector) {
      const timeToSubwarp = Fleet.calculateSubwarpTimeWithCoords(
        this.fleetStats,
        sectorFrom.data.coordinates as [BN, BN],
        sectorTo.data.coordinates as [BN, BN]
      );

      return timeToSubwarp;
    }
    /** END HELPERS */

    /** SAGE INSTRUCTIONS */

    /** CARGO */
    async ixLoadFuelTank(amount: BN) {
      const ixs: InstructionReturn[] = [];
      const fuelMint = this.getSageGame().getResourceMintByName(ResourceName.Fuel);

      const currentSector = await this.getCurrentSectorAsync();
      if (currentSector.type !== "Success") return currentSector;

      const currentStarbase = this.getSageGame().getStarbaseByCoords(currentSector.data.data.coordinates as SectorCoordinates);
      if (currentStarbase.type !== "Success") return currentStarbase;

      const starbasePlayerPod = await this.player.getStarbasePlayerPodAsync(currentStarbase.data);
      if (starbasePlayerPod.type !== "Success") return starbasePlayerPod; 
      // console.log(starbasePlayerPod)

      const starbasePlayerPodTokenAccounts = await this.getSageGame().getParsedTokenAccountsByOwner(starbasePlayerPod.data.key);
      if (starbasePlayerPodTokenAccounts.type !== "Success") return starbasePlayerPodTokenAccounts;
      // console.log(starbasePlayerPodTokenAccounts)

      const fuelStarbaseAta = starbasePlayerPodTokenAccounts.data.find(
        (tokenAccount) => tokenAccount.mint.equals(fuelMint)
      );
      if (!fuelStarbaseAta)
        return { type: "StarbaseCargoPodTokenAccountNotFound" as const };
      // console.log(fuelStarbaseAta.address.toBase58())

      const fuelTank = await this.getCurrentCargoPodDataByType(CargoPodType.FuelTank);
      if (fuelTank.type !== "Success" && fuelTank.type !== "CargoPodIsEmpty") return fuelTank;
      // console.log(fuelTank)

      const fuelAta = fuelTank.data.loadedResources.get(fuelMint.toBase58());
      // console.log(fuelLoaded)

      let fuelAtaKey = fuelAta ? fuelAta.address : (() => {
        const ix_0 = this.getSageGame().ixCreateAssociatedTokenAccountIdempotent(fuelTank.data.key, fuelMint)
        ixs.push(ix_0.instruction);
        return ix_0.address;
      })();

      // console.log(fuelAtaKey)

      // Calc the amount to deposit
      let amountToDeposit = BN.min(
        amount,
        fuelAta
          ? new BN(this.fleetCargoStats.fuelCapacity).sub(
              new BN(fuelAta.amount)
            )
          : new BN(this.fleetCargoStats.fuelCapacity)
      );
      if (amountToDeposit.eq(new BN(0))) return { type: "FleetFuelTankIsFull" as const };
      amountToDeposit = BN.min(amountToDeposit, new BN(fuelStarbaseAta.amount));
      if (amountToDeposit.eq(new BN(0))) return { type: "StarbaseCargoIsEmpty" as const };

      // console.log(amountToDeposit.toNumber())

      const input: DepositCargoToFleetInput = { keyIndex: 0, amount: amountToDeposit }

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
        starbasePlayerPod.data.key,
        fuelTank.data.key,
        this.getSageGame().getCargoTypeByMint(fuelMint),
        this.getSageGame().getCargoStatsDefinition().key,
        fuelStarbaseAta.address,
        fuelAtaKey,
        fuelMint,
        this.getSageGame().getGame().key,
        this.getSageGame().getGameState().key,
        input
      )

      ixs.push(ix_1);
      return { type: "Success" as const, ixs };
    }

    async ixUnloadFuelTank(amount: BN) {

    }

    async ixLoadAmmoBank(amount: BN) {
      const ixs: InstructionReturn[] = [];
      const ammoMint = this.getSageGame().getResourceMintByName(ResourceName.Ammo);

      const currentSector = await this.getCurrentSectorAsync();
      if (currentSector.type !== "Success") return currentSector;

      const currentStarbase = this.getSageGame().getStarbaseByCoords(currentSector.data.data.coordinates as SectorCoordinates);
      if (currentStarbase.type !== "Success") return currentStarbase;

      const starbasePlayerPod = await this.player.getStarbasePlayerPodAsync(currentStarbase.data);
      if (starbasePlayerPod.type !== "Success") return starbasePlayerPod; 
      // console.log(starbasePlayerPod)

      const starbasePlayerPodTokenAccounts = await this.getSageGame().getParsedTokenAccountsByOwner(starbasePlayerPod.data.key);
      if (starbasePlayerPodTokenAccounts.type !== "Success") return starbasePlayerPodTokenAccounts;
      // console.log(starbasePlayerPodTokenAccounts)

      const ammoStarbaseAta = starbasePlayerPodTokenAccounts.data.find(
        (tokenAccount) => tokenAccount.mint.equals(ammoMint)
      );
      if (!ammoStarbaseAta)
        return { type: "StarbaseCargoPodTokenAccountNotFound" as const };
      // console.log(fuelStarbaseAta.address.toBase58())

      const ammoBank = await this.getCurrentCargoPodDataByType(CargoPodType.AmmoBank);
      if (ammoBank.type !== "Success" && ammoBank.type !== "CargoPodIsEmpty") return ammoBank;
      // console.log(ammoBank)

      const ammoAta = ammoBank.data.loadedResources.get(ammoMint.toBase58());
      // console.log(ammoLoaded)

      let ammoAtaKey = ammoAta ? ammoAta.address : (() => {
        const ix_0 = this.getSageGame().ixCreateAssociatedTokenAccountIdempotent(ammoBank.data.key, ammoMint)
        ixs.push(ix_0.instruction);
        return ix_0.address;
      })();

      // console.log(ammoAtaKey)

      // Calc the amount to deposit
      let amountToDeposit = BN.min(
        amount,
        ammoAta
          ? new BN(this.fleetCargoStats.ammoCapacity).sub(
              new BN(ammoAta.amount)
            )
          : new BN(this.fleetCargoStats.ammoCapacity)
      );
      if (amountToDeposit.eq(new BN(0))) return { type: "FleetAmmoBankIsFull" as const };
      amountToDeposit = BN.min(amountToDeposit, new BN(ammoStarbaseAta.amount));
      if (amountToDeposit.eq(new BN(0))) return { type: "StarbaseCargoIsEmpty" as const };

      // console.log(amountToDeposit.toNumber())

      const input: DepositCargoToFleetInput = { keyIndex: 0, amount: amountToDeposit }

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
        starbasePlayerPod.data.key,
        ammoBank.data.key,
        this.getSageGame().getCargoTypeByMint(ammoMint),
        this.getSageGame().getCargoStatsDefinition().key,
        ammoStarbaseAta.address,
        ammoAtaKey,
        ammoMint,
        this.getSageGame().getGame().key,
        this.getSageGame().getGameState().key,
        input
      )

      ixs.push(ix_1);
      return { type: "Success" as const, ixs };
    }

    async ixLoadCargo(resourceName: ResourceName, amount: BN) {
      const ixs: InstructionReturn[] = [];
      const mint = this.getSageGame().getResourceMintByName(resourceName);

      const currentSector = await this.getCurrentSectorAsync();
      if (currentSector.type !== "Success") return currentSector;

      const currentStarbase = this.getSageGame().getStarbaseByCoords(currentSector.data.data.coordinates as SectorCoordinates);
      if (currentStarbase.type !== "Success") return currentStarbase;

      const starbasePlayerPod = await this.player.getStarbasePlayerPodAsync(currentStarbase.data);
      if (starbasePlayerPod.type !== "Success") return starbasePlayerPod; 
      // console.log(starbasePlayerPod)

      const starbasePlayerPodTokenAccounts = await this.getSageGame().getParsedTokenAccountsByOwner(starbasePlayerPod.data.key);
      if (starbasePlayerPodTokenAccounts.type !== "Success") return starbasePlayerPodTokenAccounts;
      // console.log(starbasePlayerPodTokenAccounts)

      const mintStarbaseAta = starbasePlayerPodTokenAccounts.data.find(
        (tokenAccount) => tokenAccount.mint.equals(mint)
      );
      if (!mintStarbaseAta)
        return { type: "StarbaseCargoPodTokenAccountNotFound" as const };
      // console.log(mintStarbaseAta.address.toBase58())

      const cargoHold = await this.getCurrentCargoPodDataByType(CargoPodType.CargoHold);
      if (cargoHold.type !== "Success" && cargoHold.type !== "CargoPodIsEmpty") return cargoHold;
      // console.log(cargoHold)

      const mintAta = cargoHold.data.loadedResources.get(mint.toBase58());
      // console.log(mintAta)

      let mintAtaKey = mintAta ? mintAta.address : (() => {
        const ix_0 = this.getSageGame().ixCreateAssociatedTokenAccountIdempotent(cargoHold.data.key, mint)
        ixs.push(ix_0.instruction);
        return ix_0.address;
      })();

      // console.log(mintAtaKey)

      // Calc the amount to deposit
      let amountToDeposit = BN.min(
        amount,
        cargoHold.data.loadedAmount > 0
          ? new BN(this.fleetCargoStats.cargoCapacity).sub(
              new BN(cargoHold.data.loadedAmount)
            )
          : new BN(this.fleetCargoStats.cargoCapacity)
      );
      if (amountToDeposit.eq(new BN(0))) return { type: "FleetCargoIsFull" as const };
      amountToDeposit = BN.min(amountToDeposit, new BN(mintStarbaseAta.amount));
      if (amountToDeposit.eq(new BN(0))) return { type: "StarbaseCargoIsEmpty" as const };

      // console.log(amountToDeposit.toNumber())

      const input: DepositCargoToFleetInput = { keyIndex: 0, amount: amountToDeposit }

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
        starbasePlayerPod.data.key,
        cargoHold.data.key,
        this.getSageGame().getCargoTypeByMint(mint),
        this.getSageGame().getCargoStatsDefinition().key,
        mintStarbaseAta.address,
        mintAtaKey,
        mint,
        this.getSageGame().getGame().key,
        this.getSageGame().getGameState().key,
        input
      )

      ixs.push(ix_1);
      return { type: "Success" as const, ixs };
    }

    async ixUnloadCargo(resourceName: ResourceName, amount: BN) {
      const ixs: InstructionReturn[] = [];
      const mint = this.getSageGame().getResourceMintByName(resourceName);

      const currentSector = await this.getCurrentSectorAsync();
      if (currentSector.type !== "Success") return currentSector;

      const currentStarbase = this.getSageGame().getStarbaseByCoords(currentSector.data.data.coordinates as SectorCoordinates);
      if (currentStarbase.type !== "Success") return currentStarbase;

      const starbasePlayerPod = await this.player.getStarbasePlayerPodAsync(currentStarbase.data);
      if (starbasePlayerPod.type !== "Success") return starbasePlayerPod; 
      // console.log(starbasePlayerPod)

      const starbasePlayerPodTokenAccounts = await this.getSageGame().getParsedTokenAccountsByOwner(starbasePlayerPod.data.key);
      if (starbasePlayerPodTokenAccounts.type !== "Success") return starbasePlayerPodTokenAccounts;
      // console.log(starbasePlayerPodTokenAccounts)

      const mintStarbaseAta = starbasePlayerPodTokenAccounts.data.find(
        (tokenAccount) => tokenAccount.mint.equals(mint)
      );

      let mintStarbaseAtaKey = mintStarbaseAta ? mintStarbaseAta.address : (() => {
        const ix_0 = this.getSageGame().ixCreateAssociatedTokenAccountIdempotent(starbasePlayerPod.data.key, mint)
        ixs.push(ix_0.instruction);
        return ix_0.address;
      })();

      // console.log(mintAtaKey)

      const cargoHold = await this.getCurrentCargoPodDataByType(CargoPodType.CargoHold);
      if (cargoHold.type !== "Success" && cargoHold.type !== "CargoPodIsEmpty") return cargoHold;
      // console.log(cargoHold)

      const mintAta = cargoHold.data.loadedResources.get(mint.toBase58());
      if (!mintAta) return { type: "FleetCargoPodTokenAccountNotFound" as const };
      // console.log(mintAta)

      // Calc the amount to withdraw
      let amountToWithdraw = BN.min(amount, new BN(mintAta.amount));
      if (amountToWithdraw.eq(new BN(0))) return { type: "NoResourcesToWithdraw" as const };

      // console.log(amountToWithdraw.toNumber())

      const input: WithdrawCargoFromFleetInput = { keyIndex: 0, amount: amountToWithdraw }

      const ix_1 = Fleet.withdrawCargoFromFleet(
        this.getSageGame().getSageProgram(),
        this.getSageGame().getCargoProgram(),
        this.getSageGame().getAsyncSigner(),
        "funder",
        this.player.getPlayerProfile().key,
        this.player.getProfileFactionAddress(),
        currentStarbase.data.key,
        this.player.getStarbasePlayerAddress(currentStarbase.data),
        this.fleet.key,
        cargoHold.data.key,
        starbasePlayerPod.data.key,
        this.getSageGame().getCargoTypeByMint(mint),
        this.getSageGame().getCargoStatsDefinition().key,
        mintAta.address,
        mintStarbaseAtaKey,
        mint,
        this.getSageGame().getGame().key,
        this.getSageGame().getGameState().key,
        input
      )

      ixs.push(ix_1);
      return { type: "Success" as const, ixs };
    }
    /** END CARGO */

    /** MINING */
    async ixStartMining(resourceName: ResourceName) {
      const ixs: InstructionReturn[] = [];
      
      const mineableResource = this.getSageGame().getMineItemAndResourceByName(resourceName);

      const currentSector = await this.getCurrentSectorAsync();
      if (currentSector.type !== "Success") return currentSector;

      const currentStarbase = this.getSageGame().getStarbaseByCoords(currentSector.data.data.coordinates as SectorCoordinates);
      if (currentStarbase.type !== "Success") return currentStarbase;

      const starbasePlayer = this.player.getStarbasePlayerAddress(currentStarbase.data);

      const currentPlanet = this.getSageGame().getPlanetsBySector(currentSector.data, PlanetType.AsteroidBelt);
      if (currentPlanet.type !== "Success") return currentPlanet;

      const input: StartMiningAsteroidInput = { keyIndex: 0 };

      const ix_1 = Fleet.startMiningAsteroid(
        this.getSageGame().getSageProgram(),
        this.getSageGame().getAsyncSigner(),
        this.player.getPlayerProfile().key,
        this.player.getProfileFactionAddress(),
        this.fleet.key,
        currentStarbase.data.key,
        starbasePlayer,
        mineableResource.mineItem.key,
        mineableResource.resource.key,
        currentPlanet.data[0].key,
        this.getSageGame().getGameState().key,
        this.getSageGame().getGame().key,
        mineableResource.mineItem.data.mint,
        input
      );
  
      ixs.push(ix_1);
  
      return { type: "Success" as const, ixs };
    }

    async ixStopMining() {
      // TODO: implement
    }
    /** END MINING */
    
    /** TRAVEL */
    async ixWarpToSector(sector: Sector) {
      const ixs: InstructionReturn[] = [];
      
      const fuelMint = this.getSageGame().getResourceMintByName(ResourceName.Fuel);
      
      const fuelTank = await this.getCurrentCargoPodDataByType(CargoPodType.FuelTank);
      if (fuelTank.type !== "Success" && fuelTank.type !== "CargoPodIsEmpty") return fuelTank;
      
      const fuelAta = fuelTank.data.loadedResources.get(fuelMint.toBase58());
      if (!fuelAta) return { type: "FleetFuelTankIsEmpty" as const };

      const input: WarpToCoordinateInput = { keyIndex: 0, toSector: sector.data.coordinates as [BN, BN] };

      const ix_0 = Fleet.warpToCoordinate(
        this.getSageGame().getSageProgram(),
        this.getSageGame().getAsyncSigner(),
        this.player.getPlayerProfile().key,
        this.player.getProfileFactionAddress(),
        this.fleet.key,
        fuelTank.data.key,
        this.getSageGame().getCargoTypeByMint(fuelMint),
        this.getSageGame().getCargoStatsDefinition().key,
        fuelAta.address,
        fuelMint,
        this.getSageGame().getGameState().key,
        this.getSageGame().getGame().key,
        this.getSageGame().getCargoProgram(),
        input
      );

      ixs.push(ix_0);

      return { type: "Success" as const, ixs };
    }

    async ixSubwarpToSector(sector: Sector) {
      const ixs: InstructionReturn[] = [];
      
      const fuelMint = this.getSageGame().getResourceMintByName(ResourceName.Fuel);
      
      const fuelTank = await this.getCurrentCargoPodDataByType(CargoPodType.FuelTank);
      if (fuelTank.type !== "Success" && fuelTank.type !== "CargoPodIsEmpty") return fuelTank;
      
      const fuelAta = fuelTank.data.loadedResources.get(fuelMint.toBase58());
      if (!fuelAta) return { type: "FleetFuelTankIsEmpty" as const };

      const input = { keyIndex: 0, toSector: sector.data.coordinates as [BN, BN] } as StartSubwarpInput;

      const ix_0 = Fleet.startSubwarp(
        this.getSageGame().getSageProgram(),
        this.getSageGame().getAsyncSigner(),
        this.player.getPlayerProfile().key,
        this.player.getProfileFactionAddress(),
        this.fleet.key,
        this.getSageGame().getGame().key,
        this.getSageGame().getGameState().key,
        input
      );

      ixs.push(ix_0);

      return { type: "Success" as const, ixs };
    }
    /** END TRAVEL */

    /** END SAGE INSTRUCTIONS */
}