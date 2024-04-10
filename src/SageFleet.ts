import { BN } from "@staratlas/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { SectorCoordinates } from "../common/types";
import { CargoStats, DepositCargoToFleetInput, Fleet, IdleToLoadingBayInput, LoadingBayToIdleInput, MovementStats, PlanetType, ScanForSurveyDataUnitsInput, Sector, Ship, ShipStats, StarbaseCreateCargoPodInput, StarbasePlayer, StartMiningAsteroidInput, StartSubwarpInput, StopMiningAsteroidInput, SurveyDataUnitTracker, WarpToCoordinateInput, WithdrawCargoFromFleetInput } from "@staratlas/sage";
import { CargoPod } from "@staratlas/cargo";
import { InstructionReturn, byteArrayToString, readAllFromRPC } from "@staratlas/data-source";
import { SagePlayer } from "./SagePlayer";
import { readFromRPCOrError } from "@staratlas/data-source";
import { MinableResource, ResourceName } from "./SageGame";
import { Account, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { MAX_AMOUNT } from "../common/constants";
import { UserPoints } from "@staratlas/points";

/* type CargoPodLoadedResource = {
  cargoType: PublicKey;
  tokenAccount: Account;
  amount: BN;
} */

// !! the best way to reduce error handling is to handle errors at instance creation level
// TODO: add cargo type?
export type LoadedResources = {
    mint: PublicKey;
    tokenAccount: Account;
}

export type CargoPodEnhanced = {
    key: PublicKey;
    loadedAmount: number;
    loadedResources: LoadedResources[]; // resource_mint: CargoPodLoadedResource
    maxCapacity: number;
    fullLoad: boolean;
}

export enum CargoPodType {
    CargoHold = "CargoHold",
    FuelTank = "FuelTank",
    AmmoBank = "AmmoBank",
}

export class SageFleet {

    private fleet!: Fleet;
    private player!: SagePlayer;

    private name: string;
    private key: PublicKey;
    private stats: ShipStats;
    private movementStats: MovementStats;
    private cargoStats: CargoStats;
    // cargoHold: CargoPodEnhanced;
    // fuelTank: CargoPodEnhanced;
    // ammoBank: CargoPodEnhanced;
    private ships!: Ship[];
    private onlyDataRunner: boolean = true;

    private constructor(fleet: Fleet, player: SagePlayer) {
        this.fleet = fleet;
        this.player = player;
        this.name = byteArrayToString(fleet.data.fleetLabel);
        this.key = fleet.key;
        this.stats = fleet.data.stats as ShipStats;
        this.movementStats = fleet.data.stats.movementStats as MovementStats;
        this.cargoStats = fleet.data.stats.cargoStats as CargoStats;
    }

    static async init(fleet: Fleet, player: SagePlayer): Promise<SageFleet> {
      const flt = new SageFleet(fleet, player);
      
      const [ships] = await Promise.all([
        flt.getShipsAccount()
      ])

      if (ships.type === "ShipsNotFound") throw new Error(ships.type);

      flt.ships = ships.data;
      flt.onlyDataRunner = flt.stats.miscStats.scanCost === 0;

      return flt;
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

    private async getShipsAccount() {
      try {
        const fetchShips = await readAllFromRPC(
          this.getSageGame().getProvider().connection,
          this.getSageGame().getSageProgram(),
          Ship,
          "confirmed"
        );

        const ships = fetchShips.flatMap((ship) =>
        ship.type === "ok" ? [ship.data] : []
        );

        if (ships.length === 0) throw new Error();

        return { type: "Success" as const, data: ships };
      } catch (e) {
        return { type: "ShipsNotFound" as const };
      }
    }

    async getCurrentSectorAsync() { 
        await this.update();     
        let coordinates;
        
        if (this.fleet.state.MoveWarp) {
          coordinates = this.fleet.state.MoveWarp.toSector as SectorCoordinates;
          return await this.getSageGame().getSectorByCoordsAsync(coordinates);
        }

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

        if (this.fleet.state.MineAsteroid) {
          const planet = this.getSageGame().getPlanetByKey(this.fleet.state.MineAsteroid.asteroid);
          if (planet.type !== "Success") return planet;

          coordinates = planet.data.data.sector as SectorCoordinates;
          return await this.getSageGame().getSectorByCoordsAsync(coordinates);
        }
      
        return { type: "FleetSectorNotFound" as const };
    };

    async getCurrentFleetStateAsync() {
      await this.update();
      return this.fleet.state;
    }

    async getCurrentCargoDataByType(type: CargoPodType) {
      await this.update();

      const cargoPodType = 
        type === CargoPodType.CargoHold ? this.fleet.data.cargoHold :
        type === CargoPodType.FuelTank ? this.fleet.data.fuelTank :
        type === CargoPodType.AmmoBank ? this.fleet.data.ammoBank :
        null;

      const cargoPodMaxCapacity = 
        type === CargoPodType.CargoHold ? this.cargoStats.cargoCapacity :
        type === CargoPodType.FuelTank ? this.cargoStats.fuelCapacity :
        type === CargoPodType.AmmoBank ? this.cargoStats.ammoCapacity :
        0;

      if (!cargoPodType) return { type: "CargoPodTypeNotFound" as const };

      const cargoPod = await this.getCargoPodByKey(cargoPodType);
      if (cargoPod.type !== "Success") return cargoPod;

      const cargoPodTokenAccounts = await this.getSageGame().getParsedTokenAccountsByOwner(cargoPod.data.key);

      if (cargoPodTokenAccounts.type !== "Success" || cargoPodTokenAccounts.data.length == 0) { 
        const cpe: CargoPodEnhanced = {
          key: cargoPod.data.key,
          loadedAmount: new BN(0),
          loadedResources: [],
          maxCapacity: cargoPodMaxCapacity,
          fullLoad: false,
        }
        return { 
          type: "CargoPodIsEmpty" as const,
          data: cpe
        };
      }

      const loadedResources: LoadedResources[] = [];
      cargoPodTokenAccounts.data.forEach((cargoPodTokenAccount) => {
        loadedResources.push({ 
          mint: cargoPodTokenAccount.mint, 
          tokenAccount: cargoPodTokenAccount 
        });
      });

      let loadedAmount = new BN(0);
      loadedResources.forEach((item) => {
        loadedAmount = loadedAmount.add(new BN(item.tokenAccount.amount));
      });

      const cpe: CargoPodEnhanced = {
        key: cargoPod.data.key,
        loadedAmount,
        loadedResources,
        maxCapacity: cargoPodMaxCapacity,
        fullLoad: loadedAmount.eq(new BN(cargoPodMaxCapacity)),
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
        this.stats,
        coordinatesFrom,
        coordinatesTo
      );

      return timeToWarp;
    }

    getTimeToWarpBySector(sectorFrom: Sector, sectorTo: Sector) {
      const timeToWarp = Fleet.calculateWarpTimeWithCoords(
        this.stats,
        sectorFrom.data.coordinates as [BN, BN],
        sectorTo.data.coordinates as [BN, BN]
      );

      return timeToWarp;
    }

    private getTimeToSubwarpByCoords(coordinatesFrom: [BN, BN], coordinatesTo: [BN, BN]) {
      const timeToSubwarp = Fleet.calculateSubwarpTimeWithCoords(
        this.stats,
        coordinatesFrom,
        coordinatesTo
      );

      return timeToSubwarp;
    }

    getTimeToSubwarpBySector(sectorFrom: Sector, sectorTo: Sector) {
      const timeToSubwarp = Fleet.calculateSubwarpTimeWithCoords(
        this.stats,
        sectorFrom.data.coordinates as [BN, BN],
        sectorTo.data.coordinates as [BN, BN]
      );

      return timeToSubwarp;
    }

    getTimeAndNeededResourcesToFullCargoInMining(minableResource: MinableResource) {
      const timeInSeconds = Fleet.calculateAsteroidMiningResourceExtractionDuration(
        this.stats,
        minableResource.mineItem.data,
        minableResource.resource.data,
        this.cargoStats.cargoCapacity
      );

      const foodNeeded = Math.ceil(
        Fleet.calculateAsteroidMiningFoodToConsume(
          this.stats,
          MAX_AMOUNT,
          timeInSeconds
        )
      );

      const ammoNeeded = Math.ceil(
        Fleet.calculateAsteroidMiningAmmoToConsume(
          this.stats,
          MAX_AMOUNT,
          timeInSeconds
        )
      );

      const fuelNeeded = this.movementStats.planetExitFuelAmount;

      return { foodNeeded, ammoNeeded, fuelNeeded, timeInSeconds };
    }

    calculateSubwarpFuelBurnWithDistance(distance: number) {
      return Fleet.calculateSubwarpFuelBurnWithDistance(this.stats, distance);
    }

    calculateWarpFuelBurnWithDistance(distance: number) {
      return Fleet.calculateWarpFuelBurnWithDistance(this.stats, distance);
    }

    calculateWarpTimeWithDistance(distance: number) {
      return Fleet.calculateWarpTime(this.stats, distance);
    }

    calculateSubwarpTimeWithDistance(distance: number) {
      return Fleet.calculateSubwarpTime(this.stats, distance);
    }
    /** END HELPERS */

    /** SAGE INSTRUCTIONS */

    /** CARGO */
    /* async ixLoadFuelTank(amount: BN) {
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
          ? new BN(this.cargoStats.fuelCapacity).sub(
              new BN(fuelAta.amount)
            )
          : new BN(this.cargoStats.fuelCapacity)
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

      const mintStarbaseAta = starbasePlayerPodTokenAccounts.data.find(
        (tokenAccount) => tokenAccount.mint.equals(fuelMint)
      );

      let mintStarbaseAtaKey = mintStarbaseAta ? mintStarbaseAta.address : (() => {
        const ix_0 = this.getSageGame().ixCreateAssociatedTokenAccountIdempotent(starbasePlayerPod.data.key, fuelMint)
        ixs.push(ix_0.instruction);
        return ix_0.address;
      })();

      // console.log(mintAtaKey)

      const fuelTank = await this.getCurrentCargoPodDataByType(CargoPodType.FuelTank);
      if (fuelTank.type !== "Success" && fuelTank.type !== "CargoPodIsEmpty") return fuelTank;
      // console.log(cargoHold)

      const mintAta = fuelTank.data.loadedResources.get(fuelMint.toBase58());
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
        fuelTank.data.key,
        starbasePlayerPod.data.key,
        this.getSageGame().getCargoTypeByMint(fuelMint),
        this.getSageGame().getCargoStatsDefinition().key,
        mintAta.address,
        mintStarbaseAtaKey,
        fuelMint,
        this.getSageGame().getGame().key,
        this.getSageGame().getGameState().key,
        input
      )

      ixs.push(ix_1);
      return { type: "Success" as const, ixs };
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
          ? new BN(this.cargoStats.ammoCapacity).sub(
              new BN(ammoAta.amount)
            )
          : new BN(this.cargoStats.ammoCapacity)
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
    } */

    async ixLoadCargo(resourceName: ResourceName, cargoPodType: CargoPodType, amount: BN) {
      const ixs: InstructionReturn[] = [];
      const mint = this.getSageGame().getResourceMintByName(resourceName);

      const currentSector = await this.getCurrentSectorAsync();
      if (currentSector.type !== "Success") return currentSector;

      const currentStarbase = this.getSageGame().getStarbaseBySector(currentSector.data);
      if (currentStarbase.type !== "Success") return currentStarbase;

      const starbasePlayerPod = await this.player.getStarbasePlayerPodAsync(currentStarbase.data);
      if (starbasePlayerPod.type !== "Success") return starbasePlayerPod; 
      // console.log(starbasePlayerPod)

      /* const starbasePlayerPodTokenAccounts = await this.getSageGame().getParsedTokenAccountsByOwner(starbasePlayerPod.data.key);
      if (starbasePlayerPodTokenAccounts.type !== "Success") return starbasePlayerPodTokenAccounts;
      // console.log(starbasePlayerPodTokenAccounts)

      const mintStarbaseAta = starbasePlayerPodTokenAccounts.data.find(
        (tokenAccount) => tokenAccount.mint.equals(mint)
      );
      if (!mintStarbaseAta)
        return { type: "StarbaseCargoPodTokenAccountNotFound" as const };
      // console.log(mintStarbaseAta.address.toBase58()) */

      const starbasePodMintAta = this.getSageGame().getAssociatedTokenAddressSync(starbasePlayerPod.data.key, mint)
      const starbasePodMintAtaBalance = await this.getSageGame().getTokenAccountBalance(starbasePodMintAta);

      const cargoPod = await this.getCurrentCargoDataByType(cargoPodType);
      if (cargoPod.type !== "Success" && cargoPod.type !== "CargoPodIsEmpty") return cargoPod;
      // console.log(cargoHold)

      /* const mintAta = cargoPod.data.loadedResources.get(mint.toBase58());
      // console.log(mintAta)

      let mintAtaKey = mintAta ? mintAta.address : (() => {
        const ix_0 = this.getSageGame().ixCreateAssociatedTokenAccountIdempotent(cargoPod.data.key, mint)
        ixs.push(ix_0.instruction);
        return ix_0.address;
      })(); */

      const ixFleetCargoPodMintAta = this.getSageGame().ixCreateAssociatedTokenAccountIdempotent(cargoPod.data.key, mint)
      ixs.push(ixFleetCargoPodMintAta.instruction);

      // console.log(mintAtaKey)
      // console.log(cargoPod.data.loadedAmount)
      // console.log(cargoPod.data.maxCapacity)

      // Calc the amount to deposit
      let amountToDeposit = BN.min(
        amount,
        cargoPod.data.loadedAmount > 0
          ? new BN(cargoPod.data.maxCapacity).sub(
              new BN(cargoPod.data.loadedAmount)
            )
          : new BN(cargoPod.data.maxCapacity)
      );
      //console.log(amountToDeposit.toNumber())
      if (amountToDeposit.eq(new BN(0))) return { type: "FleetCargoPodIsFull" as const };
      amountToDeposit = BN.min(amountToDeposit, new BN(starbasePodMintAtaBalance));
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
        cargoPod.data.key,
        this.getSageGame().getCargoTypeByMint(mint),
        this.getSageGame().getCargoStatsDefinition().key,
        starbasePodMintAta,
        ixFleetCargoPodMintAta.address,
        mint,
        this.getSageGame().getGame().key,
        this.getSageGame().getGameState().key,
        input
      )

      ixs.push(ix_1);
      return { type: "Success" as const, ixs };
    }

    async ixUnloadCargo(resourceName: ResourceName, cargoPodType: CargoPodType, amount: BN) {
      const ixs: InstructionReturn[] = [];
      const mint = this.getSageGame().getResourceMintByName(resourceName);

      const currentSector = await this.getCurrentSectorAsync();
      if (currentSector.type !== "Success") return currentSector;

      const currentStarbase = this.getSageGame().getStarbaseBySector(currentSector.data);
      if (currentStarbase.type !== "Success") return currentStarbase;

      const starbasePlayerPod = await this.player.getStarbasePlayerPodAsync(currentStarbase.data);
      if (starbasePlayerPod.type !== "Success") return starbasePlayerPod; 
      // console.log(starbasePlayerPod)

      /* const starbasePlayerPodTokenAccounts = await this.getSageGame().getParsedTokenAccountsByOwner(starbasePlayerPod.data.key);
      if (starbasePlayerPodTokenAccounts.type !== "Success") return starbasePlayerPodTokenAccounts;
      // console.log(starbasePlayerPodTokenAccounts)

      const mintStarbaseAta = starbasePlayerPodTokenAccounts.data.find(
        (tokenAccount) => tokenAccount.mint.equals(mint)
      );

      let mintStarbaseAtaKey = mintStarbaseAta ? mintStarbaseAta.address : (() => {
        const ix_0 = this.getSageGame().ixCreateAssociatedTokenAccountIdempotent(starbasePlayerPod.data.key, mint)
        ixs.push(ix_0.instruction);
        return ix_0.address;
      })(); */

      const ixStarbasePodMintAta = this.getSageGame().ixCreateAssociatedTokenAccountIdempotent(starbasePlayerPod.data.key, mint)
      ixs.push(ixStarbasePodMintAta.instruction);

      // console.log(mintAtaKey)

      const cargoPod = await this.getCurrentCargoDataByType(cargoPodType);
      if (cargoPod.type !== "Success" && cargoPod.type !== "CargoPodIsEmpty") return cargoPod;
      // console.log(cargoHold)

      const [fleetCargoPodResourceData] = cargoPod.data.loadedResources.filter((item) => item.mint.equals(mint));
      if (!fleetCargoPodResourceData) return { type: "FleetCargoPodTokenAccountNotFound" as const };
      // console.log(mintAta)

      // Calc the amount to withdraw
      let amountToWithdraw = BN.min(amount, new BN(fleetCargoPodResourceData.tokenAccount.amount));
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
        cargoPod.data.key,
        starbasePlayerPod.data.key,
        this.getSageGame().getCargoTypeByMint(mint),
        this.getSageGame().getCargoStatsDefinition().key,
        fleetCargoPodResourceData.tokenAccount.address,
        ixStarbasePodMintAta.address,
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

      const currentSector = await this.getCurrentSectorAsync();
      if (currentSector.type !== "Success") return currentSector;

      const currentStarbase = this.getSageGame().getStarbaseBySector(currentSector.data);
      if (currentStarbase.type !== "Success") return currentStarbase;

      const starbasePlayerKey = this.player.getStarbasePlayerAddress(currentStarbase.data);
      const starbasePlayer = await this.player.getStarbasePlayerByStarbaseAsync(currentStarbase.data);
      if (starbasePlayer.type !== "Success") {
        const ix_0 = StarbasePlayer.registerStarbasePlayer(
          this.getSageGame().getSageProgram(),
          this.player.getProfileFactionAddress(),
          this.player.getSagePlayerProfileAddress(),
          currentStarbase.data.key,
          this.getSageGame().getGame().key,
          this.getSageGame().getGameState().key,
          currentStarbase.data.data.seqId
        );
        ixs.push(ix_0);
      }

      const currentPlanet = this.getSageGame().getPlanetsBySector(currentSector.data, PlanetType.AsteroidBelt);
      if (currentPlanet.type !== "Success") return currentPlanet;

      const mineableResource = this.getSageGame().getMineItemAndResourceByNameAndPlanetKey(resourceName, currentPlanet.data[0].key);

      const fuelTank = await this.getCurrentCargoDataByType(CargoPodType.FuelTank);
      if (fuelTank.type !== "Success") return fuelTank;

      const [fuelInTankData] = fuelTank.data.loadedResources.filter((item) => item.mint.equals(this.getSageGame().getResourcesMint().Fuel));
      if (!fuelInTankData) return { type: "FleetCargoPodTokenAccountNotFound" as const };

      const input: StartMiningAsteroidInput = { keyIndex: 0 };

      // Movement Handler
      const ix_movement = await this.ixMovementHandler();
      if (ix_movement.type !== "Success") return ix_movement;
      if (ix_movement.ixs.length > 0) ixs.push(...ix_movement.ixs);

      const ix_1 = Fleet.startMiningAsteroid(
        this.getSageGame().getSageProgram(),
        this.getSageGame().getAsyncSigner(),
        this.player.getPlayerProfile().key,
        this.player.getProfileFactionAddress(),
        this.fleet.key,
        currentStarbase.data.key,
        starbasePlayerKey,
        mineableResource.mineItem.key,
        mineableResource.resource.key,
        currentPlanet.data[0].key,
        this.getSageGame().getGameState().key,
        this.getSageGame().getGame().key,
        fuelInTankData.tokenAccount.address,
        input
      );
      ixs.push(ix_1);
  
      return { type: "Success" as const, ixs };
    }

    // FIX: I often get the 6087 (InvalidTime) error when trying to stop mining. Why?
    async ixStopMining() {
      const ixs: InstructionReturn[] = [];

      const currentSector = await this.getCurrentSectorAsync();
      if (currentSector.type !== "Success") return currentSector;

      const currentStarbase = this.getSageGame().getStarbaseBySector(currentSector.data);
      if (currentStarbase.type !== "Success") return currentStarbase;

      if (!this.fleet.state.MineAsteroid)
      return { type: "FleetIsNotMiningAsteroid" as const };
      
      const planetKey = this.fleet.state.MineAsteroid.asteroid;
      const miningResourceKey = this.fleet.state.MineAsteroid.resource

      const miningResource = this.getSageGame().getResourceByKey(miningResourceKey);
      if (miningResource.type !== "Success") return miningResource;

      const miningMineItem = this.getSageGame().getMineItemByKey(miningResource.data.data.mineItem)
      if (miningMineItem.type !== "Success") return miningMineItem;

      const miningMint = miningMineItem.data.data.mint

      const cargoPod = await this.getCurrentCargoDataByType(CargoPodType.CargoHold);
      if (cargoPod.type !== "Success") return cargoPod;

      const fleetCargoPodMintAta = this.getSageGame().ixCreateAssociatedTokenAccountIdempotent(cargoPod.data.key, miningMint)
      ixs.push(fleetCargoPodMintAta.instruction);

      /* const mintAta = cargoPod.data.loadedResources.get(miningMint.toBase58());

      let mintAtaKey = mintAta ? mintAta.address : (() => {
        const ix_0 = this.getSageGame().ixCreateAssociatedTokenAccountIdempotent(cargoPod.data.key, miningMint)
        ixs.push(ix_0.instruction);
        return ix_0.address;
      })();
 */
      const [foodInCargoData] = cargoPod.data.loadedResources.filter((item) => item.mint.equals(this.getSageGame().getResourcesMint().Food));
      if (!foodInCargoData) return { type: "FleetCargoPodTokenAccountNotFound" as const };

      const ammoBank = await this.getCurrentCargoDataByType(CargoPodType.AmmoBank);
      if (ammoBank.type !== "Success") return ammoBank;

      const [ammoInBankData] = ammoBank.data.loadedResources.filter((item) => item.mint.equals(this.getSageGame().getResourcesMint().Ammo));
      if (!ammoInBankData) return { type: "FleetCargoPodTokenAccountNotFound" as const };

      const fuelTank = await this.getCurrentCargoDataByType(CargoPodType.FuelTank);
      if (fuelTank.type !== "Success") return fuelTank;

      const [fuelInTankData] = fuelTank.data.loadedResources.filter((item) => item.mint.equals(this.getSageGame().getResourcesMint().Fuel));
      if (!fuelInTankData) return { type: "FleetCargoPodTokenAccountNotFound" as const };

      const miningResourceFrom = getAssociatedTokenAddressSync(miningMint, miningMineItem.data.key, true);

      const ix_0 = Fleet.asteroidMiningHandler(
        this.getSageGame().getSageProgram(),
        this.getSageGame().getCargoProgram(),
        this.fleet.key,
        currentStarbase.data.key,
        miningMineItem.data.key,
        miningResource.data.key,
        planetKey,
        this.fleet.data.cargoHold,
        this.fleet.data.ammoBank,
        this.getSageGame().getCargoTypeByResourceName(ResourceName.Food),
        this.getSageGame().getCargoTypeByResourceName(ResourceName.Ammo),
        this.getSageGame().getCargoTypeByMint(miningMineItem.data.data.mint),
        this.getSageGame().getCargoStatsDefinition().key,
        this.getSageGame().getGameState().key,
        this.getSageGame().getGame().key,
        foodInCargoData.tokenAccount.address,
        ammoInBankData.tokenAccount.address,
        miningResourceFrom,
        fleetCargoPodMintAta.address,
        this.getSageGame().getResourcesMint().Food,
        this.getSageGame().getResourcesMint().Ammo
      );
      ixs.push(ix_0);

      const input: StopMiningAsteroidInput = { keyIndex: 0 };

      // Points
      const userPoints = await this.player.getUserPointsAsync();
      if (userPoints.type !== "Success") return userPoints;

      const miningXpCategory = this.getSageGame().getGamePoints().miningXpCategory;
      const pilotXpCategory = this.getSageGame().getGamePoints().pilotXpCategory;
      const councilRankXpCategory = this.getSageGame().getGamePoints().councilRankXpCategory;

      const [userMiningXp] = userPoints.data.filter((account) => account.data.pointCategory.equals(miningXpCategory.category));
      const [userPilotXp] = userPoints.data.filter((account) => account.data.pointCategory.equals(pilotXpCategory.category));
      const [userCouncilRankXp] = userPoints.data.filter((account) => account.data.pointCategory.equals(councilRankXpCategory.category));

      const userMiningXpKey = userMiningXp ? 
        userMiningXp.key : 
        UserPoints.findAddress(this.getSageGame().getPointsProgram(), miningXpCategory.category, this.player.getPlayerProfile().key)[0];

      const userPilotXpKey = userPilotXp ?
        userPilotXp.key :
        UserPoints.findAddress(this.getSageGame().getPointsProgram(), pilotXpCategory.category, this.player.getPlayerProfile().key)[0];

      const userCouncilRankXpKey = userCouncilRankXp ?
        userCouncilRankXp.key :
        UserPoints.findAddress(this.getSageGame().getPointsProgram(), councilRankXpCategory.category, this.player.getPlayerProfile().key)[0];

      /* console.log(
        this.getSageGame().getSageProgram().programId,
        this.getSageGame().getCargoProgram().programId,
        this.getSageGame().getPointsProgram().programId,
        this.getSageGame().getAsyncSigner().publicKey,
        this.player.getPlayerProfile().key,
        this.player.getProfileFactionAddress(),
        this.fleet.key,
        miningMineItem.data.key,
        miningResource.data.key,
        planetKey,
        this.fleet.data.fuelTank,
        this.getSageGame().getCargoTypeByResourceName(ResourceName.Fuel),
        this.getSageGame().getCargoStatsDefinition().key,
        userMiningXp.key,
        miningXpCategory.category,
        miningXpCategory.modifier,
        userPilotXp.key,
        pilotXpCategory.category,
        pilotXpCategory.modifier,
        userCouncilRankXp.key,
        councilRankXpCategory.category,
        councilRankXpCategory.modifier,
        this.getSageGame().getGameState().key,
        this.getSageGame().getGame().key,
        fuelAta.address,
        this.getSageGame().getResourcesMint().Fuel,
        input,
      ) */

      const ix_1 = Fleet.stopMiningAsteroid(
        this.getSageGame().getSageProgram(),
        this.getSageGame().getCargoProgram(),
        this.getSageGame().getPointsProgram(),
        this.getSageGame().getAsyncSigner(),
        this.player.getPlayerProfile().key,
        this.player.getProfileFactionAddress(),
        this.fleet.key,
        miningMineItem.data.key,
        miningResource.data.key,
        planetKey,
        this.fleet.data.fuelTank,
        this.getSageGame().getCargoTypeByResourceName(ResourceName.Fuel),
        this.getSageGame().getCargoStatsDefinition().key,
        userMiningXpKey,
        miningXpCategory.category,
        miningXpCategory.modifier,
        userPilotXpKey,
        pilotXpCategory.category,
        pilotXpCategory.modifier,
        userCouncilRankXpKey,
        councilRankXpCategory.category,
        councilRankXpCategory.modifier,
        this.getSageGame().getGameState().key,
        this.getSageGame().getGame().key,
        fuelInTankData.tokenAccount.address,
        this.getSageGame().getResourcesMint().Fuel,
        input,
      );
      ixs.push(ix_1);
      
      return { type: "Success" as const, ixs };
    }
    /** END MINING */
    
    /** TRAVEL */
    async ixDockToStarbase() {
      const ixs: InstructionReturn[] = [];

      const currentSector = await this.getCurrentSectorAsync();
      if (currentSector.type !== "Success") return currentSector;

      const currentStarbase = this.getSageGame().getStarbaseBySector(currentSector.data);
      if (currentStarbase.type !== "Success") return currentStarbase;

      const starbasePlayerKey = this.player.getStarbasePlayerAddress(currentStarbase.data);
      const starbasePlayer = await this.player.getStarbasePlayerByStarbaseAsync(currentStarbase.data);
      if (starbasePlayer.type !== "Success") {
        const ix_0 = StarbasePlayer.registerStarbasePlayer(
          this.getSageGame().getSageProgram(),
          this.player.getProfileFactionAddress(),
          this.player.getSagePlayerProfileAddress(),
          currentStarbase.data.key,
          this.getSageGame().getGame().key,
          this.getSageGame().getGameState().key,
          currentStarbase.data.data.seqId
        );
        ixs.push(ix_0);

        const podSeedBuffer = Keypair.generate().publicKey.toBuffer();
        const podSeeds = Array.from(podSeedBuffer);

        const cargoInput: StarbaseCreateCargoPodInput = {
          keyIndex: 0,
          podSeeds,
        };

        const ix_1 = StarbasePlayer.createCargoPod(
          this.getSageGame().getSageProgram(),
          this.getSageGame().getCargoProgram(),
          starbasePlayerKey,
          this.getSageGame().getAsyncSigner(),
          this.player.getPlayerProfile().key,
          this.player.getProfileFactionAddress(),
          currentStarbase.data.key,
          this.getSageGame().getCargoStatsDefinition().key,
          this.getSageGame().getGame().key,
          this.getSageGame().getGameState().key,
          cargoInput
        );
        ixs.push(ix_1);
      };

      const input: IdleToLoadingBayInput = 0;

      // Movement Handler
      const ix_movement = await this.ixMovementHandler();
      if (ix_movement.type !== "Success") return ix_movement;
      if (ix_movement.ixs.length > 0) ixs.push(...ix_movement.ixs);

      const ix_2 = Fleet.idleToLoadingBay(
        this.getSageGame().getSageProgram(),
        this.getSageGame().getAsyncSigner(),
        this.player.getPlayerProfile().key,
        this.player.getProfileFactionAddress(),
        this.fleet.key,
        currentStarbase.data.key,
        starbasePlayerKey,
        this.getSageGame().getGame().key,
        this.getSageGame().getGameState().key,
        input
      );
      ixs.push(ix_2);

      return { type: "Success" as const, ixs };
    }

    async ixUndockFromStarbase() {
      const ixs: InstructionReturn[] = [];

      const currentSector = await this.getCurrentSectorAsync();
      if (currentSector.type !== "Success") return currentSector;

      const currentStarbase = this.getSageGame().getStarbaseBySector(currentSector.data);
      if (currentStarbase.type !== "Success") return currentStarbase;

      const starbasePlayerKey = this.player.getStarbasePlayerAddress(currentStarbase.data);

      const input: LoadingBayToIdleInput = 0;

      const ix_1 = Fleet.loadingBayToIdle(
        this.getSageGame().getSageProgram(),
        this.getSageGame().getAsyncSigner(),
        this.player.getPlayerProfile().key,
        this.player.getProfileFactionAddress(),
        this.fleet.key,
        currentStarbase.data.key,
        starbasePlayerKey,
        this.getSageGame().getGame().key,
        this.getSageGame().getGameState().key,
        input
      );
      ixs.push(ix_1);

      return { type: "Success" as const, ixs };
    }

    async ixWarpToSector(sector: Sector, fuelNeeded: BN) {
      const ixs: InstructionReturn[] = [];

      const fuelMint = this.getSageGame().getResourceMintByName(ResourceName.Fuel);
      
      const fuelTank = await this.getCurrentCargoDataByType(CargoPodType.FuelTank);
      if (fuelTank.type !== "Success" && fuelTank.type !== "CargoPodIsEmpty") return fuelTank;
      
      const [fuelInTankData] = fuelTank.data.loadedResources.filter((item) => item.mint.equals(fuelMint));
      if (!fuelInTankData) return { type: "FleetFuelTankIsEmpty" as const };

      if (new BN(fuelInTankData.tokenAccount.amount).lt(fuelNeeded)) 
        return { type: "NoEnoughFuelToWarp" as const };

      const input: WarpToCoordinateInput = { keyIndex: 0, toSector: sector.data.coordinates as [BN, BN] };

      // Movement Handler
      const ix_movement = await this.ixMovementHandler();
      if (ix_movement.type !== "Success") return ix_movement;
      if (ix_movement.ixs.length > 0) ixs.push(...ix_movement.ixs);

      /* console.log(
        // this.getSageGame().getSageProgram(),
        // this.getSageGame().getAsyncSigner(),
        this.player.getPlayerProfile().key,
        this.player.getProfileFactionAddress(),
        this.fleet.key,
        fuelTank.data.key,
        this.getSageGame().getCargoTypeByMint(fuelMint),
        this.getSageGame().getCargoStatsDefinition().key,
        fuelInTankData.tokenAccount.address,
        fuelMint,
        this.getSageGame().getGameState().key,
        this.getSageGame().getGame().key,
        // this.getSageGame().getCargoProgram(),
        input
      ) */

      const ix_0 = Fleet.warpToCoordinate(
        this.getSageGame().getSageProgram(),
        this.getSageGame().getAsyncSigner(),
        this.player.getPlayerProfile().key,
        this.player.getProfileFactionAddress(),
        this.fleet.key,
        fuelTank.data.key,
        this.getSageGame().getCargoTypeByMint(fuelMint),
        this.getSageGame().getCargoStatsDefinition().key,
        fuelInTankData.tokenAccount.address,
        fuelMint,
        this.getSageGame().getGameState().key,
        this.getSageGame().getGame().key,
        this.getSageGame().getCargoProgram(),
        input
      );

      ixs.push(ix_0);

      return { type: "Success" as const, ixs };
    }

    async ixSubwarpToSector(sector: Sector, fuelNeeded: BN) {
      const ixs: InstructionReturn[] = [];
      
      const fuelMint = this.getSageGame().getResourceMintByName(ResourceName.Fuel);
      
      const fuelTank = await this.getCurrentCargoDataByType(CargoPodType.FuelTank);
      if (fuelTank.type !== "Success" && fuelTank.type !== "CargoPodIsEmpty") return fuelTank;
      
      const [fuelInTankData] = fuelTank.data.loadedResources.filter((item) => item.mint.equals(fuelMint));
      if (!fuelInTankData) return { type: "FleetFuelTankIsEmpty" as const };

      if (new BN(fuelInTankData.tokenAccount.amount).lt(fuelNeeded)) 
        return { type: "NoEnoughFuelToSubwarp" as const };

      const input = { keyIndex: 0, toSector: sector.data.coordinates as [BN, BN] } as StartSubwarpInput;

      // Movement Handler
      const ix_movement = await this.ixMovementHandler();
      if (ix_movement.type !== "Success") return ix_movement;
      if (ix_movement.ixs.length > 0) ixs.push(...ix_movement.ixs);

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

    async ixMovementHandler() { // Warp and Subwarp Handler
      const fuelMint = this.getSageGame().getResourceMintByName(ResourceName.Fuel);
      
      const fuelTank = await this.getCurrentCargoDataByType(CargoPodType.FuelTank);
      if (fuelTank.type !== "Success" && fuelTank.type !== "CargoPodIsEmpty") return fuelTank;
      
      const [fuelInTankData] = fuelTank.data.loadedResources.filter((item) => item.mint.equals(fuelMint));
      if (!fuelInTankData) return { type: "FleetFuelTankIsEmpty" as const };

      // Points
      const userPoints = await this.player.getUserPointsAsync();
      if (userPoints.type !== "Success") return userPoints;

      const pilotXpCategory = this.getSageGame().getGamePoints().pilotXpCategory;
      const councilRankXpCategory = this.getSageGame().getGamePoints().councilRankXpCategory;

      const [userPilotXp] = userPoints.data.filter((account) => account.data.pointCategory.equals(pilotXpCategory.category));
      const [userCouncilRankXp] = userPoints.data.filter((account) => account.data.pointCategory.equals(councilRankXpCategory.category));

      const userPilotXpKey = userPilotXp ?
        userPilotXp.key :
        UserPoints.findAddress(this.getSageGame().getPointsProgram(), pilotXpCategory.category, this.player.getPlayerProfile().key)[0];

      const userCouncilRankXpKey = userCouncilRankXp ?
        userCouncilRankXp.key :
        UserPoints.findAddress(this.getSageGame().getPointsProgram(), councilRankXpCategory.category, this.player.getPlayerProfile().key)[0];

      const ix_movement = this.fleet.state.MoveWarp ? 
        [Fleet.moveWarpHandler(
          this.getSageGame().getSageProgram(),
          this.getSageGame().getPointsProgram(),
          this.getPlayer().getPlayerProfile().key,
          this.key,
          userPilotXpKey,
          pilotXpCategory.category,
          pilotXpCategory.modifier,
          userCouncilRankXpKey,
          councilRankXpCategory.category,
          councilRankXpCategory.modifier,
          this.getSageGame().getGame().key,
        )] : this.fleet.state.MoveSubwarp ?
        [Fleet.movementSubwarpHandler(
          this.getSageGame().getSageProgram(),
          this.getSageGame().getCargoProgram(),
          this.getSageGame().getPointsProgram(),
          this.getPlayer().getPlayerProfile().key,
          this.key,
          fuelTank.data.key,
          this.getSageGame().getCargoTypeByMint(fuelMint),
          this.getSageGame().getCargoStatsDefinition().key,
          fuelInTankData.tokenAccount.address,
          fuelMint,
          userPilotXpKey,
          pilotXpCategory.category,
          pilotXpCategory.modifier,
          userCouncilRankXpKey,
          councilRankXpCategory.category,
          councilRankXpCategory.modifier,
          this.getSageGame().getGame().key,
        )] : [];

        return { type: "Success" as const, ixs: ix_movement };
    }
    /** END TRAVEL */

    /** SCANNING */
    async ixScanForSurveyDataUnits() {
      const ixs: InstructionReturn[] = [];

      const sduMint = this.getSageGame().getResourceMintByName(ResourceName.Sdu)

      const currentSector = await this.getCurrentSectorAsync();
      if (currentSector.type !== "Success") return currentSector;

      const cargoHold = await this.getCurrentCargoDataByType(CargoPodType.CargoHold);
      if (cargoHold.type !== "Success") return cargoHold;

      if (cargoHold.data.fullLoad) return { type: "FleetCargoIsFull" as const }

      const [toolInCargoData] = cargoHold.data.loadedResources.filter((item) => item.mint.equals(sduMint));
      if (!toolInCargoData) return { type: "FleetCargoPodTokenAccountNotFound" as const };

      if (!this.onlyDataRunner && toolInCargoData.tokenAccount.amount < this.stats.miscStats.scanCost) return { type: "NoEnoughRepairKits" as const }

      const sduTokenFrom = getAssociatedTokenAddressSync(
        sduMint,
        this.getSageGame().getSuvreyDataUnitTracker().data.signer,
        true
      );

      const sduTokenTo = this.getSageGame().ixCreateAssociatedTokenAccountIdempotent(cargoHold.data.key, sduMint)
      ixs.push(sduTokenTo.instruction);

      // Points
      const userPoints = await this.player.getUserPointsAsync();
      if (userPoints.type !== "Success") return userPoints;

      const dataRunningXpCategory = this.getSageGame().getGamePoints().dataRunningXpCategory;
      const councilRankXpCategory = this.getSageGame().getGamePoints().councilRankXpCategory;

      const [userDataRunningXp] = userPoints.data.filter((account) => account.data.pointCategory.equals(dataRunningXpCategory.category));
      const [userCouncilRankXp] = userPoints.data.filter((account) => account.data.pointCategory.equals(councilRankXpCategory.category));
      
      const userDataRunningKey = userDataRunningXp ? 
        userDataRunningXp.key : 
        UserPoints.findAddress(this.getSageGame().getPointsProgram(), dataRunningXpCategory.category, this.player.getPlayerProfile().key)[0];  

      const userCouncilRankXpKey = userCouncilRankXp ? 
        userCouncilRankXp.key : 
        UserPoints.findAddress(this.getSageGame().getPointsProgram(), councilRankXpCategory.category, this.player.getPlayerProfile().key)[0];  

      const input: ScanForSurveyDataUnitsInput = { keyIndex: 0 };

      // Movement Handler
      const ix_movement = await this.ixMovementHandler();
      if (ix_movement.type !== "Success") return ix_movement;
      if (ix_movement.ixs.length > 0) ixs.push(...ix_movement.ixs);

      const ix_0 = SurveyDataUnitTracker.scanForSurveyDataUnits(
        this.getSageGame().getSageProgram(),
        this.getSageGame().getCargoProgram(),
        this.getSageGame().getPointsProgram(),
        this.getSageGame().getAsyncSigner(),
        this.player.getPlayerProfile().key,
        this.player.getProfileFactionAddress(),
        this.fleet.key,
        currentSector.data.key,
        this.getSageGame().getSuvreyDataUnitTracker().key,
        cargoHold.data.key,
        sduMint,
        this.getSageGame().getCargoTypeByResourceName(ResourceName.Tool),
        this.getSageGame().getCargoStatsDefinition().key,
        sduTokenFrom,
        sduTokenTo.address,
        toolInCargoData.tokenAccount.address,
        this.getSageGame().getResourceMintByName(ResourceName.Tool),
        userDataRunningKey,
        dataRunningXpCategory.category,
        dataRunningXpCategory.modifier,
        userCouncilRankXpKey,
        councilRankXpCategory.category,
        councilRankXpCategory.modifier,
        this.getSageGame().getGame().key,
        this.getSageGame().getGameState().key,
        input
      );

      ixs.push(ix_0);

      return { type: "Success" as const, ixs };
    }
    /** END SCANNING */

    /** END SAGE INSTRUCTIONS */
}

// !! usa più spesso createAssociatedTokenAccountIdempotent
// !! usa più spesso getAssociatedTokenAddressSync