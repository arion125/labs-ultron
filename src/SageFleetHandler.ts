import { BN } from "@project-serum/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  InstructionReturn,
  createAssociatedTokenAccountIdempotent,
  readFromRPCOrError,
} from "@staratlas/data-source";
import {
  CargoStats,
  DepositCargoToFleetInput,
  Fleet,
  LoadingBayToIdleInput,
  MineItem,
  Planet,
  Resource,
  Sector,
  ShipStats,
  Starbase,
  StarbaseCreateCargoPodInput,
  StarbasePlayer,
  StartMiningAsteroidInput,
  StartSubwarpInput,
  StopMiningAsteroidInput,
  WarpToCoordinateInput,
} from "@staratlas/sage";

import { SectorCoordinates } from "../common/types";
import { checkConnectionAndGameState } from "../utils/instructions/checkConnectionAndGameState";
import { SageGameHandler } from "./SageGameHandler";

export class SageFleetHandler {
  constructor(private _gameHandler: SageGameHandler) {}

  async getFleetAccount(fleetPubkey: PublicKey) {
    try {
      const fleet = await readFromRPCOrError(
        this._gameHandler.provider.connection,
        this._gameHandler.program,
        fleetPubkey,
        Fleet,
        "confirmed"
      );
      return { type: "Success" as const, fleet };
    } catch (e) {
      return { type: "FleetNotFound" as const };
    }
  }

  async getMineItemAccount(mineItemPubkey: PublicKey) {
    try {
      const mineItem = await readFromRPCOrError(
        this._gameHandler.provider.connection,
        this._gameHandler.program,
        mineItemPubkey,
        MineItem,
        "confirmed"
      );
      return { type: "Success" as const, mineItem };
    } catch (e) {
      return { type: "MineItemNotFound" as const };
    }
  }

  async getPlanetAccount(planetPubkey: PublicKey) {
    try {
      const planet = await readFromRPCOrError(
        this._gameHandler.provider.connection,
        this._gameHandler.program,
        planetPubkey,
        Planet,
        "confirmed"
      );
      return { type: "Success" as const, planet };
    } catch (e) {
      return { type: "PlanetNotFound" as const };
    }
  }

  async getResourceAccount(resourcePubkey: PublicKey) {
    try {
      const resource = await readFromRPCOrError(
        this._gameHandler.provider.connection,
        this._gameHandler.program,
        resourcePubkey,
        Resource,
        "confirmed"
      );
      return { type: "Success" as const, resource };
    } catch (e) {
      return { type: "ResourceNotFound" as const };
    }
  }

  async getSectorAccount(sectorPubkey: PublicKey) {
    try {
      const sector = await readFromRPCOrError(
        this._gameHandler.provider.connection,
        this._gameHandler.program,
        sectorPubkey,
        Sector,
        "confirmed"
      );
      return { type: "Success" as const, sector };
    } catch (e) {
      return { type: "SectorNotFound" as const };
    }
  }

  async getStarbaseAccount(starbasePubkey: PublicKey) {
    try {
      const starbase = await readFromRPCOrError(
        this._gameHandler.provider.connection,
        this._gameHandler.program,
        starbasePubkey,
        Starbase,
        "confirmed"
      );
      return { type: "Success" as const, starbase };
    } catch (e) {
      return { type: "StarbaseNotFound" as const };
    }
  }

  // OK
  async ixDockToStarbase(fleetPubkey: PublicKey) {
    const ixs: InstructionReturn[] = [];

    // Check connection and game state
    const connectionAndGameState = await checkConnectionAndGameState(
      this._gameHandler
    );
    if (connectionAndGameState.type !== "Success")
      return connectionAndGameState;

    // Get all fleet data
    const fleetAccount = await this.getFleetAccount(fleetPubkey);
    if (fleetAccount.type !== "Success") return fleetAccount;
    if (!fleetAccount.fleet.state.Idle)
      return { type: "FleetIsNotIdle" as const };
    const coordinates = fleetAccount.fleet.state.Idle?.sector as [BN, BN];

    // Get player profile data
    const playerProfilePubkey = fleetAccount.fleet.data.ownerProfile;
    const sagePlayerProfilePubkey =
      this._gameHandler.getSagePlayerProfileAddress(playerProfilePubkey);
    /* const sagePlayerProfileAccount =
      await this._gameHandler.getPlayerProfileAccount(sagePlayerProfilePubkey); */
    const profileFactionPubkey =
      this._gameHandler.getProfileFactionAddress(playerProfilePubkey);

    const program = this._gameHandler.program;
    const cargoProgram = this._gameHandler.cargoProgram;
    const gameId = this._gameHandler.gameId as PublicKey;
    const gameState = this._gameHandler.gameState as PublicKey;
    const key = this._gameHandler.funder;

    const starbasePubkey = this._gameHandler.getStarbaseAddress(coordinates);
    const starbaseAccount = await this.getStarbaseAccount(starbasePubkey);
    if (starbaseAccount.type !== "Success") return starbaseAccount;
    const starbasePlayerPubkey = this._gameHandler.getStarbasePlayerAddress(
      starbasePubkey,
      sagePlayerProfilePubkey,
      starbaseAccount.starbase.data.seqId
    );
    const starbasePlayerAccount =
      await this._gameHandler.getStarbasePlayerAccount(starbasePlayerPubkey);
    if (starbasePlayerAccount.type !== "Success") {
      const ix_0 = StarbasePlayer.registerStarbasePlayer(
        program,
        profileFactionPubkey,
        sagePlayerProfilePubkey,
        starbasePubkey,
        gameId,
        gameState,
        starbaseAccount.starbase.data.seqId
      );
      ixs.push(ix_0);

      const cargoStatsDefinition = this._gameHandler.cargoStatsDefinition;
      if (!cargoStatsDefinition)
        return { type: "CargoStatsDefinitionNotFound" as const };

      const podSeedBuffer = Keypair.generate().publicKey.toBuffer();
      const podSeeds = Array.from(podSeedBuffer);

      const cargoInput = {
        keyIndex: 0,
        podSeeds,
      } as StarbaseCreateCargoPodInput;

      const ix_1 = StarbasePlayer.createCargoPod(
        program,
        cargoProgram,
        starbasePlayerPubkey,
        key,
        playerProfilePubkey,
        profileFactionPubkey,
        starbasePubkey,
        cargoStatsDefinition,
        gameId,
        gameState,
        cargoInput
      );

      ixs.push(ix_1);
    }

    const fleetKey = fleetAccount.fleet.key;
    const input = 0 as LoadingBayToIdleInput;

    const ix_2 = Fleet.idleToLoadingBay(
      program,
      key,
      playerProfilePubkey,
      profileFactionPubkey,
      fleetKey,
      starbasePubkey,
      starbasePlayerPubkey,
      gameId,
      gameState,
      input
    );

    ixs.push(ix_2);

    return { type: "Success" as const, ixs };
  }

  // OK
  async ixUndockFromStarbase(fleetPubkey: PublicKey) {
    const ixs: InstructionReturn[] = [];

    // Check connection and game state
    const connectionAndGameState = await checkConnectionAndGameState(
      this._gameHandler
    );
    if (connectionAndGameState.type !== "Success")
      return connectionAndGameState;

    // Get all fleet data
    const fleetAccount = await this.getFleetAccount(fleetPubkey);
    if (fleetAccount.type !== "Success") return fleetAccount;
    if (!fleetAccount.fleet.state.StarbaseLoadingBay)
      return { type: "FleetIsNotAtStarbaseLoadingBay" as const };

    // Get player profile data
    const playerProfilePubkey = fleetAccount.fleet.data.ownerProfile;
    const sagePlayerProfilePubkey =
      this._gameHandler.getSagePlayerProfileAddress(playerProfilePubkey);
    const profileFactionPubkey =
      this._gameHandler.getProfileFactionAddress(playerProfilePubkey);

    // Get starbase where the fleet is located
    const starbasePubkey = fleetAccount.fleet.state.StarbaseLoadingBay.starbase;
    const starbaseAccount = await this.getStarbaseAccount(starbasePubkey);
    if (starbaseAccount.type !== "Success") return starbaseAccount;
    const starbasePlayerPubkey = this._gameHandler.getStarbasePlayerAddress(
      starbasePubkey,
      sagePlayerProfilePubkey,
      starbaseAccount.starbase.data.seqId
    );

    const program = this._gameHandler.program;
    const key = this._gameHandler.funder;
    const fleetKey = fleetAccount.fleet.key;
    const gameId = this._gameHandler.gameId as PublicKey;
    const gameState = this._gameHandler.gameState as PublicKey;
    const input = 0 as LoadingBayToIdleInput;

    const ix_1 = Fleet.loadingBayToIdle(
      program,
      key,
      playerProfilePubkey,
      profileFactionPubkey,
      fleetKey,
      starbasePubkey,
      starbasePlayerPubkey,
      gameId,
      gameState,
      input
    );

    ixs.push(ix_1);

    return { type: "Success" as const, ixs };
  }

  // OK
  async ixStartMining(fleetPubkey: PublicKey, resource: string) {
    const ixs: InstructionReturn[] = [];

    // Check connection and game state
    const connectionAndGameState = await checkConnectionAndGameState(
      this._gameHandler
    );
    if (connectionAndGameState.type !== "Success")
      return connectionAndGameState;

    // Get all fleet data
    const fleetAccount = await this.getFleetAccount(fleetPubkey);
    if (fleetAccount.type !== "Success") return fleetAccount;
    if (!fleetAccount.fleet.state.Idle)
      return { type: "FleetIsNotIdle" as const };

    const coordinates = fleetAccount.fleet.state.Idle?.sector as [BN, BN];

    // Get player profile data
    const playerProfilePubkey = fleetAccount.fleet.data.ownerProfile;
    const sagePlayerProfilePubkey =
      this._gameHandler.getSagePlayerProfileAddress(playerProfilePubkey);
    const profileFactionPubkey =
      this._gameHandler.getProfileFactionAddress(playerProfilePubkey);

    const program = this._gameHandler.program;
    const gameState = this._gameHandler.gameState as PublicKey;
    const gameId = this._gameHandler.gameId as PublicKey;

    const starbasePubkey = this._gameHandler.getStarbaseAddress(coordinates);
    const starbaseAccount = await this.getStarbaseAccount(starbasePubkey);
    if (starbaseAccount.type !== "Success") return starbaseAccount;
    const starbasePlayerPubkey = this._gameHandler.getStarbasePlayerAddress(
      starbasePubkey,
      sagePlayerProfilePubkey,
      starbaseAccount.starbase.data.seqId
    );
    const starbasePlayerAccount =
      await this._gameHandler.getStarbasePlayerAccount(starbasePlayerPubkey);
    if (starbasePlayerAccount.type !== "Success") {
      const ix_0 = StarbasePlayer.registerStarbasePlayer(
        program,
        profileFactionPubkey,
        sagePlayerProfilePubkey,
        starbasePubkey,
        gameId,
        gameState,
        starbaseAccount.starbase.data.seqId
      );
      ixs.push(ix_0);
    }

    const planetKey = this._gameHandler.getPlanetAddress(
      starbaseAccount.starbase.data.sector as [BN, BN]
    );
    const mint = this._gameHandler.getResourceMintAddress(resource);
    const mineItemKey = this._gameHandler.getMineItemAddress(mint);
    const resourceKey = this._gameHandler.getResrouceAddress(
      mineItemKey,
      planetKey
    );
    const fleetKey = fleetAccount.fleet.key;
    const key = this._gameHandler.funder;
    const input = { keyIndex: 0 } as StartMiningAsteroidInput;

    const ix_1 = Fleet.startMiningAsteroid(
      program,
      key,
      playerProfilePubkey,
      profileFactionPubkey,
      fleetKey,
      starbasePubkey,
      starbasePlayerPubkey,
      mineItemKey,
      resourceKey,
      planetKey,
      gameState,
      gameId,
      input
    );

    ixs.push(ix_1);

    return { type: "Success" as const, ixs };
  }

  // OK
  async ixStopMining(fleetPubkey: PublicKey) {
    const ixs: InstructionReturn[] = [];

    // Check connection and game state
    const connectionAndGameState = await checkConnectionAndGameState(
      this._gameHandler
    );
    if (connectionAndGameState.type !== "Success")
      return connectionAndGameState;

    // Get all fleet data
    const fleetAccount = await this.getFleetAccount(fleetPubkey);
    if (fleetAccount.type !== "Success") return fleetAccount;
    if (!fleetAccount.fleet.state.MineAsteroid)
      return { type: "FleetIsNotMiningAsteroid" as const };

    const gameFoodMint = this._gameHandler.game?.data.mints.food as PublicKey;
    const gameAmmoMint = this._gameHandler.game?.data.mints.ammo as PublicKey;
    const gameFuelMint = this._gameHandler.game?.data.mints.fuel as PublicKey;

    const resourcePubkey = fleetAccount.fleet.state.MineAsteroid.resource;
    const resourceAccount = await this.getResourceAccount(resourcePubkey);
    if (resourceAccount.type !== "Success") return resourceAccount;

    const mineItemPubkey = resourceAccount.resource.data.mineItem;
    const mineItemAccount = await this.getMineItemAccount(mineItemPubkey);
    if (mineItemAccount.type !== "Success") return mineItemAccount;
    const mint = mineItemAccount.mineItem.data.mint;

    const planetPubkey = fleetAccount.fleet.state.MineAsteroid.asteroid;
    const planetAccount = await this.getPlanetAccount(planetPubkey);
    if (planetAccount.type !== "Success") return planetAccount;

    const coordinates = planetAccount.planet.data.sector as [BN, BN];
    const starbasePubkey = this._gameHandler.getStarbaseAddress(coordinates);

    const cargoHold = fleetAccount.fleet.data.cargoHold;
    const fleetAmmoBank = fleetAccount.fleet.data.ammoBank;
    const fleetFuelTank = fleetAccount.fleet.data.fuelTank;

    const resourceTokenFrom = getAssociatedTokenAddressSync(
      mint,
      mineItemPubkey,
      true
    );
    const ataResourceTokenTo = createAssociatedTokenAccountIdempotent(
      mint,
      cargoHold,
      true
    );
    const resourceTokenTo = ataResourceTokenTo.address;
    const ix_0 = ataResourceTokenTo.instructions;

    ixs.push(ix_0);

    const fleetFoodToken = getAssociatedTokenAddressSync(
      gameFoodMint,
      cargoHold,
      true
    );
    const fleetAmmoToken = getAssociatedTokenAddressSync(
      gameAmmoMint,
      fleetAmmoBank,
      true
    );
    const fleetFuelToken = getAssociatedTokenAddressSync(
      gameFuelMint,
      fleetFuelTank,
      true
    );

    const program = this._gameHandler.program;
    const cargoProgram = this._gameHandler.cargoProgram;
    const playerProfile = fleetAccount.fleet.data.ownerProfile;
    const profileFaction =
      this._gameHandler.getProfileFactionAddress(playerProfile);
    const fleetKey = fleetAccount.fleet.key;
    const ammoBank = fleetAccount.fleet.data.ammoBank;
    const foodCargoType = this._gameHandler.getCargoTypeAddress(gameFoodMint);
    const ammoCargoType = this._gameHandler.getCargoTypeAddress(gameAmmoMint);
    const resourceCargoType = this._gameHandler.getCargoTypeAddress(mint);
    const cargoStatsDefinition = this._gameHandler
      .cargoStatsDefinition as PublicKey;
    const gameState = this._gameHandler.gameState as PublicKey;
    const gameId = this._gameHandler.gameId as PublicKey;
    const foodTokenFrom = fleetFoodToken;
    const ammoTokenFrom = fleetAmmoToken;
    const foodMint = gameFoodMint;
    const ammoMint = gameAmmoMint;

    const ix_1 = Fleet.asteroidMiningHandler(
      program,
      cargoProgram,
      profileFaction,
      fleetKey,
      starbasePubkey,
      mineItemPubkey,
      resourcePubkey,
      planetPubkey,
      cargoHold,
      ammoBank,
      foodCargoType,
      ammoCargoType,
      resourceCargoType,
      cargoStatsDefinition,
      gameState,
      gameId,
      foodTokenFrom,
      ammoTokenFrom,
      resourceTokenFrom,
      resourceTokenTo,
      foodMint,
      ammoMint
    );

    ixs.push(ix_1);

    const key = this._gameHandler.funder;
    const fuelTank = fleetFuelTank;
    const fuelCargoType = this._gameHandler.getCargoTypeAddress(gameFuelMint);
    const fuelTokenFrom = fleetFuelToken;
    const fuelMint = gameFuelMint;
    const input = { keyIndex: 0 } as StopMiningAsteroidInput;

    const ix_2 = Fleet.stopMiningAsteroid(
      program,
      cargoProgram,
      key,
      playerProfile,
      profileFaction,
      fleetKey,
      resourcePubkey,
      planetPubkey,
      fuelTank,
      fuelCargoType,
      cargoStatsDefinition,
      gameState,
      gameId,
      fuelTokenFrom,
      fuelMint,
      input
    );

    ixs.push(ix_2);

    return { type: "Success" as const, ixs };
  }

  // OK
  async ixDepositCargoToFleet(
    fleetPubkey: PublicKey,
    tokenMint: PublicKey,
    amount: number
  ) {
    const ixs: InstructionReturn[] = [];

    // Check connection and game state
    const connectionAndGameState = await checkConnectionAndGameState(
      this._gameHandler
    );
    if (connectionAndGameState.type !== "Success")
      return connectionAndGameState;

    if (amount < 0) return { type: "AmountCantBeNegative" as const };

    // Get all fleet data
    const fleetAccount = await this.getFleetAccount(fleetPubkey);
    if (fleetAccount.type !== "Success") return fleetAccount;
    if (!fleetAccount.fleet.state.StarbaseLoadingBay)
      return { type: "FleetIsNotAtStarbaseLoadingBay" as const };
    const fleetCargoStats = fleetAccount.fleet.data.stats
      .cargoStats as CargoStats;

    // Get player profile data
    const playerProfilePubkey = fleetAccount.fleet.data.ownerProfile;
    const sagePlayerProfilePubkey =
      this._gameHandler.getSagePlayerProfileAddress(playerProfilePubkey);
    const profileFactionPubkey =
      this._gameHandler.getProfileFactionAddress(playerProfilePubkey);

    // Get starbase where the fleet is located
    const starbasePubkey = fleetAccount.fleet.state.StarbaseLoadingBay.starbase;
    const starbaseAccount = await this.getStarbaseAccount(starbasePubkey);
    if (starbaseAccount.type !== "Success") return starbaseAccount;

    const starbasePlayerPubkey = this._gameHandler.getStarbasePlayerAddress(
      starbasePubkey,
      sagePlayerProfilePubkey,
      starbaseAccount.starbase.data.seqId
    );

    // Get starbase player cargo pod
    const starbasePlayerCargoPodsAccount =
      await this._gameHandler.getCargoPodsByAuthority(starbasePlayerPubkey);
    if (starbasePlayerCargoPodsAccount.type !== "Success")
      return starbasePlayerCargoPodsAccount;
    const [starbasePlayerCargoPods] = starbasePlayerCargoPodsAccount.cargoPods;
    const starbasePlayerCargoPodsPubkey = starbasePlayerCargoPods.key;
    const tokenAccountsFrom =
      await this._gameHandler.getParsedTokenAccountsByOwner(
        starbasePlayerCargoPodsPubkey
      );
    if (tokenAccountsFrom.type !== "Success") return tokenAccountsFrom;
    const tokenAccountFrom = tokenAccountsFrom.tokenAccounts.find(
      (tokenAccount) => tokenAccount.mint.toBase58() === tokenMint.toBase58()
    );
    if (!tokenAccountFrom)
      return { type: "StarbaseCargoPodTokenAccountNotFound" as const };
    const tokenAccountFromPubkey = tokenAccountFrom.address;

    // Get fleet cargo hold
    const fleetCargoHoldsPubkey = fleetAccount.fleet.data.cargoHold;
    const fleetCargoHoldsTokenAccounts =
      await this._gameHandler.getParsedTokenAccountsByOwner(
        fleetCargoHoldsPubkey
      );
    if (fleetCargoHoldsTokenAccounts.type !== "Success")
      return fleetCargoHoldsTokenAccounts;
    const currentFleetCargoAmount =
      fleetCargoHoldsTokenAccounts.tokenAccounts.reduce(
        (accumulator, currentAccount) => {
          return accumulator + Number(currentAccount.amount);
        },
        0
      );
    const tokenAccountToATA = createAssociatedTokenAccountIdempotent(
      tokenMint,
      fleetCargoHoldsPubkey,
      true
    );
    const tokenAccountToPubkey = tokenAccountToATA.address;
    const ix_0 = tokenAccountToATA.instructions;
    ixs.push(ix_0);

    // Calc the amount to deposit
    let amountBN = BN.min(
      new BN(amount),
      fleetCargoHoldsTokenAccounts.tokenAccounts.length > 0
        ? new BN(fleetCargoStats.cargoCapacity).sub(
            new BN(currentFleetCargoAmount)
          )
        : new BN(fleetCargoStats.cargoCapacity)
    );
    if (amountBN == 0) return { type: "FleetCargoIsFull" as const };
    amountBN = BN.min(amountBN, new BN(tokenAccountFrom.amount));
    if (amountBN == 0) return { type: "StarbaseCargoIsEmpty" as const };

    // Other accounts
    const program = this._gameHandler.program;
    const cargoProgram = this._gameHandler.cargoProgram;
    const payer = this._gameHandler.funder;
    const payerPubkey = payer.publicKey();
    const gameId = this._gameHandler.gameId as PublicKey;
    const gameState = this._gameHandler.gameState as PublicKey;
    const input = { keyIndex: 0, amount: amountBN } as DepositCargoToFleetInput;
    const cargoType = this._gameHandler.getCargoTypeAddress(tokenMint);
    const cargoStatsDefinition = this._gameHandler
      .cargoStatsDefinition as PublicKey;

    // Compose the main instruction
    const ix_1 = Fleet.depositCargoToFleet(
      program,
      cargoProgram,
      payer,
      playerProfilePubkey,
      profileFactionPubkey,
      payerPubkey,
      starbasePubkey,
      starbasePlayerPubkey,
      fleetPubkey,
      starbasePlayerCargoPodsPubkey,
      fleetCargoHoldsPubkey,
      cargoType,
      cargoStatsDefinition,
      tokenAccountFromPubkey,
      tokenAccountToPubkey,
      tokenMint,
      gameId,
      gameState,
      input
    );
    ixs.push(ix_1);
    return { type: "Success" as const, ixs };
  }

  // OK
  async ixWithdrawCargoFromFleet(
    fleetPubkey: PublicKey,
    tokenMint: PublicKey,
    amount: number
  ) {
    const ixs: InstructionReturn[] = [];

    // Check connection and game state
    const connectionAndGameState = await checkConnectionAndGameState(
      this._gameHandler
    );
    if (connectionAndGameState.type !== "Success")
      return connectionAndGameState;

    if (amount < 0) return { type: "AmountCantBeNegative" as const };

    // Get all fleet data
    const fleetAccount = await this.getFleetAccount(fleetPubkey);
    if (fleetAccount.type !== "Success") return fleetAccount;
    if (!fleetAccount.fleet.state.StarbaseLoadingBay)
      return { type: "FleetIsNotAtStarbaseLoadingBay" as const };

    // Get player profile data
    const playerProfilePubkey = fleetAccount.fleet.data.ownerProfile;
    const sagePlayerProfilePubkey =
      this._gameHandler.getSagePlayerProfileAddress(playerProfilePubkey);
    const profileFactionPubkey =
      this._gameHandler.getProfileFactionAddress(playerProfilePubkey);

    // Get fleet cargo hold
    const fleetCargoHoldsPubkey = fleetAccount.fleet.data.cargoHold;
    const fleetCargoHoldsTokenAccounts =
      await this._gameHandler.getParsedTokenAccountsByOwner(
        fleetCargoHoldsPubkey
      );
    if (fleetCargoHoldsTokenAccounts.type !== "Success")
      return fleetCargoHoldsTokenAccounts;
    const tokenAccountsFrom =
      await this._gameHandler.getParsedTokenAccountsByOwner(
        fleetCargoHoldsPubkey
      );
    if (tokenAccountsFrom.type !== "Success") return tokenAccountsFrom;
    const tokenAccountFrom = tokenAccountsFrom.tokenAccounts.find(
      (tokenAccount) => tokenAccount.mint.toBase58() === tokenMint.toBase58()
    );
    if (!tokenAccountFrom)
      return { type: "FleetCargoHoldTokenAccountNotFound" as const };

    const tokenAccountFromPubkey = tokenAccountFrom.address;

    // Get starbase where the fleet is located
    const starbasePubkey = fleetAccount.fleet.state.StarbaseLoadingBay.starbase;
    const starbaseAccount = await this.getStarbaseAccount(starbasePubkey);
    if (starbaseAccount.type !== "Success") return starbaseAccount;
    const starbasePlayerPubkey = this._gameHandler.getStarbasePlayerAddress(
      starbasePubkey,
      sagePlayerProfilePubkey,
      starbaseAccount.starbase.data.seqId
    );

    // Get starbase player cargo pod
    const starbasePlayerCargoPodsAccount =
      await this._gameHandler.getCargoPodsByAuthority(starbasePlayerPubkey);
    if (starbasePlayerCargoPodsAccount.type !== "Success")
      return starbasePlayerCargoPodsAccount;

    const [starbasePlayerCargoPods] = starbasePlayerCargoPodsAccount.cargoPods;
    const starbasePlayerCargoPodsPubkey = starbasePlayerCargoPods.key;
    const tokenAccountToATA = createAssociatedTokenAccountIdempotent(
      tokenMint,
      starbasePlayerCargoPodsPubkey,
      true
    );
    const tokenAccountToPubkey = tokenAccountToATA.address;
    const ix_0 = tokenAccountToATA.instructions;
    ixs.push(ix_0);

    // Calc the amount to withdraw
    let amountBN = BN.min(new BN(amount), new BN(tokenAccountFrom.amount));
    if (amountBN == 0) return { type: "NoResourcesToWithdraw" as const };

    // Other accounts
    const program = this._gameHandler.program;
    const cargoProgram = this._gameHandler.cargoProgram;
    const payer = this._gameHandler.funder;
    const payerPubkey = payer.publicKey();
    const gameId = this._gameHandler.gameId as PublicKey;
    const gameState = this._gameHandler.gameState as PublicKey;
    const input = { keyIndex: 0, amount: amountBN } as DepositCargoToFleetInput;
    const cargoType = this._gameHandler.getCargoTypeAddress(tokenMint);
    const cargoStatsDefinition = this._gameHandler
      .cargoStatsDefinition as PublicKey;

    // Compose the main instruction
    const ix_1 = Fleet.withdrawCargoFromFleet(
      program,
      cargoProgram,
      payer,
      payerPubkey,
      playerProfilePubkey,
      profileFactionPubkey,
      starbasePubkey,
      starbasePlayerPubkey,
      fleetPubkey,
      fleetCargoHoldsPubkey,
      starbasePlayerCargoPodsPubkey,
      cargoType,
      cargoStatsDefinition,
      tokenAccountFromPubkey,
      tokenAccountToPubkey,
      tokenMint,
      gameId,
      gameState,
      input
    );
    ixs.push(ix_1);
    return { type: "Success" as const, ixs };
  }

  // OK
  async ixRefuelFleet(fleetPubkey: PublicKey, amount: number) {
    const ixs: InstructionReturn[] = [];

    const connectionAndGameState = await checkConnectionAndGameState(
      this._gameHandler
    );
    if (connectionAndGameState.type !== "Success")
      return connectionAndGameState;

    if (amount < 0) return { type: "AmountCantBeNegative" as const };

    // Get all fleet data
    const fleetAccount = await this.getFleetAccount(fleetPubkey);
    if (fleetAccount.type !== "Success") return fleetAccount;
    if (!fleetAccount.fleet.state.StarbaseLoadingBay)
      return { type: "FleetIsNotAtStarbaseLoadingBay" as const };
    const fleetCargoStats = fleetAccount.fleet.data.stats
      .cargoStats as CargoStats;

    const fuelMint = this._gameHandler.getResourceMintAddress("fuel");

    // Get player profile data
    const playerProfilePubkey = fleetAccount.fleet.data.ownerProfile;
    const sagePlayerProfilePubkey =
      this._gameHandler.getSagePlayerProfileAddress(playerProfilePubkey);
    const profileFactionPubkey =
      this._gameHandler.getProfileFactionAddress(playerProfilePubkey);

    // Get starbase where the fleet is located
    const starbasePubkey = fleetAccount.fleet.state.StarbaseLoadingBay.starbase;
    const starbaseAccount = await this.getStarbaseAccount(starbasePubkey);
    if (starbaseAccount.type !== "Success") return starbaseAccount;
    const starbasePlayerPubkey = this._gameHandler.getStarbasePlayerAddress(
      starbasePubkey,
      sagePlayerProfilePubkey,
      starbaseAccount.starbase.data.seqId
    );

    const starbasePlayerCargoPodsAccount =
      await this._gameHandler.getCargoPodsByAuthority(starbasePlayerPubkey);
    if (starbasePlayerCargoPodsAccount.type !== "Success")
      return starbasePlayerCargoPodsAccount;
    const [starbasePlayerCargoPods] = starbasePlayerCargoPodsAccount.cargoPods;
    const starbasePlayerCargoPodsPubkey = starbasePlayerCargoPods.key;
    const tokenAccountsFrom =
      await this._gameHandler.getParsedTokenAccountsByOwner(
        starbasePlayerCargoPodsPubkey
      );
    if (tokenAccountsFrom.type !== "Success") return tokenAccountsFrom;
    const tokenAccountFrom = tokenAccountsFrom.tokenAccounts.find(
      (tokenAccount) => tokenAccount.mint.toBase58() === fuelMint.toBase58()
    );
    if (!tokenAccountFrom)
      return { type: "StarbaseCargoPodTokenAccountNotFound" as const };
    const tokenAccountFromPubkey = tokenAccountFrom.address;

    // This PDA account is the owner of all the resources in the fleet's cargo (Fleet Cargo Holds - Stiva della flotta)
    const fleetFuelTankPubkey = fleetAccount.fleet.data.fuelTank;
    const tokenAccountsTo =
      await this._gameHandler.getParsedTokenAccountsByOwner(
        fleetFuelTankPubkey
      );
    if (tokenAccountsTo.type !== "Success") return tokenAccountsTo;

    const tokenAccountTo = tokenAccountsTo.tokenAccounts.find(
      (tokenAccount) => tokenAccount.mint.toBase58() === fuelMint.toBase58()
    );

    const tokenAccountToATA = createAssociatedTokenAccountIdempotent(
      fuelMint,
      fleetFuelTankPubkey,
      true
    );
    const tokenAccountToPubkey = tokenAccountToATA.address;

    const ix_0 = tokenAccountToATA.instructions;
    ixs.push(ix_0);

    // Calc the amount to deposit
    let amountBN = BN.min(
      new BN(amount),
      tokenAccountTo
        ? new BN(fleetCargoStats.fuelCapacity).sub(
            new BN(tokenAccountTo.amount)
          )
        : new BN(fleetCargoStats.fuelCapacity)
    );
    if (amountBN == 0) return { type: "FleetFuelTankIsFull" as const };
    amountBN = BN.min(amountBN, new BN(tokenAccountFrom.amount));
    if (amountBN == 0) return { type: "StarbaseCargoIsEmpty" as const };

    const program = this._gameHandler.program;
    const cargoProgram = this._gameHandler.cargoProgram;
    const payer = this._gameHandler.funder;
    const payerPubkey = payer.publicKey();
    const gameId = this._gameHandler.gameId as PublicKey;
    const gameState = this._gameHandler.gameState as PublicKey;
    const input = { keyIndex: 0, amount: amountBN } as DepositCargoToFleetInput;
    const cargoType = this._gameHandler.getCargoTypeAddress(fuelMint);
    const cargoStatsDefinition = this._gameHandler
      .cargoStatsDefinition as PublicKey;

    const ix_1 = Fleet.depositCargoToFleet(
      program,
      cargoProgram,
      payer,
      playerProfilePubkey,
      profileFactionPubkey,
      payerPubkey,
      starbasePubkey,
      starbasePlayerPubkey,
      fleetPubkey,
      starbasePlayerCargoPodsPubkey,
      fleetFuelTankPubkey,
      cargoType,
      cargoStatsDefinition,
      tokenAccountFromPubkey,
      tokenAccountToPubkey,
      fuelMint,
      gameId,
      gameState,
      input
    );

    ixs.push(ix_1);

    return { type: "Success" as const, ixs };
  }

  // OK
  async ixUnloadFuelTanks(fleetPubkey: PublicKey, amount: number) {
    const ixs: InstructionReturn[] = [];

    // Check connection and game state
    const connectionAndGameState = await checkConnectionAndGameState(
      this._gameHandler
    );
    if (connectionAndGameState.type !== "Success")
      return connectionAndGameState;

    if (amount < 0) return { type: "AmountCantBeNegative" as const };

    // Get all fleet data
    const fleetAccount = await this.getFleetAccount(fleetPubkey);
    if (fleetAccount.type !== "Success") return fleetAccount;
    if (!fleetAccount.fleet.state.StarbaseLoadingBay)
      return { type: "FleetIsNotAtStarbaseLoadingBay" as const };

    const fuelMint = this._gameHandler.getResourceMintAddress("fuel");

    // Get player profile data
    const playerProfilePubkey = fleetAccount.fleet.data.ownerProfile;
    const sagePlayerProfilePubkey =
      this._gameHandler.getSagePlayerProfileAddress(playerProfilePubkey);
    const profileFactionPubkey =
      this._gameHandler.getProfileFactionAddress(playerProfilePubkey);

    // This PDA account is the owner of all the resources in the fleet's cargo (Fleet Cargo Holds - Stiva della flotta)
    const fleetFuelTankPubkey = fleetAccount.fleet.data.fuelTank;
    const tokenAccountsFrom =
      await this._gameHandler.getParsedTokenAccountsByOwner(
        fleetFuelTankPubkey
      );
    if (tokenAccountsFrom.type !== "Success") return tokenAccountsFrom;

    const tokenAccountFrom = tokenAccountsFrom.tokenAccounts.find(
      (tokenAccount) => tokenAccount.mint.toBase58() === fuelMint.toBase58()
    );
    if (!tokenAccountFrom)
      return { type: "FleetFuelTankTokenAccountNotFound" as const };

    const tokenAccountFromPubkey = tokenAccountFrom.address;

    // Get starbase where the fleet is located
    const starbasePubkey = fleetAccount.fleet.state.StarbaseLoadingBay.starbase;
    const starbaseAccount = await this.getStarbaseAccount(starbasePubkey);
    if (starbaseAccount.type !== "Success") return starbaseAccount;
    const starbasePlayerPubkey = this._gameHandler.getStarbasePlayerAddress(
      starbasePubkey,
      sagePlayerProfilePubkey,
      starbaseAccount.starbase.data.seqId
    );

    // Get starbase player cargo pod
    const starbasePlayerCargoPodsAccount =
      await this._gameHandler.getCargoPodsByAuthority(starbasePlayerPubkey);
    if (starbasePlayerCargoPodsAccount.type !== "Success")
      return starbasePlayerCargoPodsAccount;
    const [starbasePlayerCargoPods] = starbasePlayerCargoPodsAccount.cargoPods;
    const starbasePlayerCargoPodsPubkey = starbasePlayerCargoPods.key;
    const tokenAccountToATA = createAssociatedTokenAccountIdempotent(
      fuelMint,
      starbasePlayerCargoPodsPubkey,
      true
    );
    const tokenAccountToPubkey = tokenAccountToATA.address;
    const ix_0 = tokenAccountToATA.instructions;
    ixs.push(ix_0);

    let amountBN = BN.min(new BN(amount), new BN(tokenAccountFrom.amount));
    if (amountBN == 0) return { type: "NoFuelToUnload" as const };

    const program = this._gameHandler.program;
    const cargoProgram = this._gameHandler.cargoProgram;
    const payer = this._gameHandler.funder;
    const payerPubkey = payer.publicKey();
    const gameId = this._gameHandler.gameId as PublicKey;
    const gameState = this._gameHandler.gameState as PublicKey;
    const input = { keyIndex: 0, amount: amountBN } as DepositCargoToFleetInput;
    const cargoType = this._gameHandler.getCargoTypeAddress(fuelMint);
    const cargoStatsDefinition = this._gameHandler
      .cargoStatsDefinition as PublicKey;

    const ix_1 = Fleet.withdrawCargoFromFleet(
      program,
      cargoProgram,
      payer,
      payerPubkey,
      playerProfilePubkey,
      profileFactionPubkey,
      starbasePubkey,
      starbasePlayerPubkey,
      fleetPubkey,
      fleetFuelTankPubkey,
      starbasePlayerCargoPodsPubkey,
      cargoType,
      cargoStatsDefinition,
      tokenAccountFromPubkey,
      tokenAccountToPubkey,
      fuelMint,
      gameId,
      gameState,
      input
    );

    ixs.push(ix_1);

    return { type: "Success" as const, ixs };
  }

  // OK
  async ixRearmFleet(fleetPubkey: PublicKey, amount: number) {
    const ixs: InstructionReturn[] = [];

    const connectionAndGameState = await checkConnectionAndGameState(
      this._gameHandler
    );
    if (connectionAndGameState.type !== "Success")
      return connectionAndGameState;

    if (amount < 0) return { type: "AmountCantBeNegative" as const };

    // Get all fleet data
    const fleetAccount = await this.getFleetAccount(fleetPubkey);
    if (fleetAccount.type !== "Success") return fleetAccount;
    if (!fleetAccount.fleet.state.StarbaseLoadingBay)
      return { type: "FleetIsNotAtStarbaseLoadingBay" as const };
    const fleetCargoStats = fleetAccount.fleet.data.stats
      .cargoStats as CargoStats;

    const ammoMint = this._gameHandler.getResourceMintAddress("ammo");

    // Get player profile data
    const playerProfilePubkey = fleetAccount.fleet.data.ownerProfile;
    const sagePlayerProfilePubkey =
      this._gameHandler.getSagePlayerProfileAddress(playerProfilePubkey);
    const profileFactionPubkey =
      this._gameHandler.getProfileFactionAddress(playerProfilePubkey);

    // Get starbase where the fleet is located
    const starbasePubkey = fleetAccount.fleet.state.StarbaseLoadingBay.starbase;
    const starbaseAccount = await this.getStarbaseAccount(starbasePubkey);
    if (starbaseAccount.type !== "Success") return starbaseAccount;
    const starbasePlayerPubkey = this._gameHandler.getStarbasePlayerAddress(
      starbasePubkey,
      sagePlayerProfilePubkey,
      starbaseAccount.starbase.data.seqId
    );

    const starbasePlayerCargoPodsAccount =
      await this._gameHandler.getCargoPodsByAuthority(starbasePlayerPubkey);
    if (starbasePlayerCargoPodsAccount.type !== "Success")
      return starbasePlayerCargoPodsAccount;
    const [starbasePlayerCargoPods] = starbasePlayerCargoPodsAccount.cargoPods;
    const starbasePlayerCargoPodsPubkey = starbasePlayerCargoPods.key;
    const tokenAccountsFrom =
      await this._gameHandler.getParsedTokenAccountsByOwner(
        starbasePlayerCargoPodsPubkey
      );
    if (tokenAccountsFrom.type !== "Success") return tokenAccountsFrom;
    const tokenAccountFrom = tokenAccountsFrom.tokenAccounts.find(
      (tokenAccount) => tokenAccount.mint.toBase58() === ammoMint.toBase58()
    );
    if (!tokenAccountFrom)
      return { type: "StarbaseCargoPodTokenAccountNotFound" as const };
    const tokenAccountFromPubkey = tokenAccountFrom.address;

    // This PDA account is the owner of all the resources in the fleet's cargo (Fleet Cargo Holds - Stiva della flotta)
    const fleetAmmoBankPubkey = fleetAccount.fleet.data.ammoBank;
    const tokenAccountsTo =
      await this._gameHandler.getParsedTokenAccountsByOwner(
        fleetAmmoBankPubkey
      );
    if (tokenAccountsTo.type !== "Success") return tokenAccountsTo;

    const tokenAccountTo = tokenAccountsTo.tokenAccounts.find(
      (tokenAccount) => tokenAccount.mint.toBase58() === ammoMint.toBase58()
    );

    const tokenAccountToATA = createAssociatedTokenAccountIdempotent(
      ammoMint,
      fleetAmmoBankPubkey,
      true
    );
    const tokenAccountToPubkey = tokenAccountToATA.address;

    const ix_0 = tokenAccountToATA.instructions;
    ixs.push(ix_0);

    // Calc the amount to deposit
    let amountBN = BN.min(
      new BN(amount),
      tokenAccountTo
        ? new BN(fleetCargoStats.ammoCapacity).sub(
            new BN(tokenAccountTo.amount)
          )
        : new BN(fleetCargoStats.ammoCapacity)
    );
    if (amountBN == 0) return { type: "FleetAmmoBankIsFull" as const };
    amountBN = BN.min(amountBN, new BN(tokenAccountFrom.amount));
    if (amountBN == 0) return { type: "StarbaseCargoIsEmpty" as const };

    const program = this._gameHandler.program;
    const cargoProgram = this._gameHandler.cargoProgram;
    const payer = this._gameHandler.funder;
    const payerPubkey = payer.publicKey();
    const gameId = this._gameHandler.gameId as PublicKey;
    const gameState = this._gameHandler.gameState as PublicKey;
    const input = { keyIndex: 0, amount: amountBN } as DepositCargoToFleetInput;
    const cargoType = this._gameHandler.getCargoTypeAddress(ammoMint);
    const cargoStatsDefinition = this._gameHandler
      .cargoStatsDefinition as PublicKey;

    const ix_1 = Fleet.depositCargoToFleet(
      program,
      cargoProgram,
      payer,
      playerProfilePubkey,
      profileFactionPubkey,
      payerPubkey,
      starbasePubkey,
      starbasePlayerPubkey,
      fleetPubkey,
      starbasePlayerCargoPodsPubkey,
      fleetAmmoBankPubkey,
      cargoType,
      cargoStatsDefinition,
      tokenAccountFromPubkey,
      tokenAccountToPubkey,
      ammoMint,
      gameId,
      gameState,
      input
    );

    ixs.push(ix_1);

    return { type: "Success" as const, ixs };
  }

  // OK
  async ixUnloadAmmoBanks(fleetPubkey: PublicKey, amount: number) {
    const ixs: InstructionReturn[] = [];

    // Check connection and game state
    const connectionAndGameState = await checkConnectionAndGameState(
      this._gameHandler
    );
    if (connectionAndGameState.type !== "Success")
      return connectionAndGameState;

    if (amount < 0) return { type: "AmountCantBeNegative" as const };

    // Get all fleet data
    const fleetAccount = await this.getFleetAccount(fleetPubkey);
    if (fleetAccount.type !== "Success") return fleetAccount;
    if (!fleetAccount.fleet.state.StarbaseLoadingBay)
      return { type: "FleetIsNotAtStarbaseLoadingBay" as const };

    const ammoMint = this._gameHandler.getResourceMintAddress("ammo");

    // Get player profile data
    const playerProfilePubkey = fleetAccount.fleet.data.ownerProfile;
    const sagePlayerProfilePubkey =
      this._gameHandler.getSagePlayerProfileAddress(playerProfilePubkey);
    const profileFactionPubkey =
      this._gameHandler.getProfileFactionAddress(playerProfilePubkey);

    // This PDA account is the owner of all the resources in the fleet's cargo (Fleet Cargo Holds - Stiva della flotta)
    const fleetAmmoBankPubkey = fleetAccount.fleet.data.ammoBank;
    const tokenAccountsFrom =
      await this._gameHandler.getParsedTokenAccountsByOwner(
        fleetAmmoBankPubkey
      );
    if (tokenAccountsFrom.type !== "Success") return tokenAccountsFrom;

    const tokenAccountFrom = tokenAccountsFrom.tokenAccounts.find(
      (tokenAccount) => tokenAccount.mint.toBase58() === ammoMint.toBase58()
    );
    if (!tokenAccountFrom)
      return { type: "FleetAmmoBankTokenAccountNotFound" as const };

    const tokenAccountFromPubkey = tokenAccountFrom.address;

    // Get starbase where the fleet is located
    const starbasePubkey = fleetAccount.fleet.state.StarbaseLoadingBay.starbase;
    const starbaseAccount = await this.getStarbaseAccount(starbasePubkey);
    if (starbaseAccount.type !== "Success") return starbaseAccount;
    const starbasePlayerPubkey = this._gameHandler.getStarbasePlayerAddress(
      starbasePubkey,
      sagePlayerProfilePubkey,
      starbaseAccount.starbase.data.seqId
    );

    // Get starbase player cargo pod
    const starbasePlayerCargoPodsAccount =
      await this._gameHandler.getCargoPodsByAuthority(starbasePlayerPubkey);
    if (starbasePlayerCargoPodsAccount.type !== "Success")
      return starbasePlayerCargoPodsAccount;
    const [starbasePlayerCargoPods] = starbasePlayerCargoPodsAccount.cargoPods;
    const starbasePlayerCargoPodsPubkey = starbasePlayerCargoPods.key;
    const tokenAccountToATA = createAssociatedTokenAccountIdempotent(
      ammoMint,
      starbasePlayerCargoPodsPubkey,
      true
    );
    const tokenAccountToPubkey = tokenAccountToATA.address;
    const ix_0 = tokenAccountToATA.instructions;
    ixs.push(ix_0);

    let amountBN = BN.min(new BN(amount), new BN(tokenAccountFrom.amount));
    if (amountBN == 0) return { type: "NoAmmoToUnload" as const };

    const program = this._gameHandler.program;
    const cargoProgram = this._gameHandler.cargoProgram;
    const payer = this._gameHandler.funder;
    const payerPubkey = payer.publicKey();
    const gameId = this._gameHandler.gameId as PublicKey;
    const gameState = this._gameHandler.gameState as PublicKey;
    const input = { keyIndex: 0, amount: amountBN } as DepositCargoToFleetInput;
    const cargoType = this._gameHandler.getCargoTypeAddress(ammoMint);
    const cargoStatsDefinition = this._gameHandler
      .cargoStatsDefinition as PublicKey;

    const ix_1 = Fleet.withdrawCargoFromFleet(
      program,
      cargoProgram,
      payer,
      payerPubkey,
      playerProfilePubkey,
      profileFactionPubkey,
      starbasePubkey,
      starbasePlayerPubkey,
      fleetPubkey,
      fleetAmmoBankPubkey,
      starbasePlayerCargoPodsPubkey,
      cargoType,
      cargoStatsDefinition,
      tokenAccountToPubkey,
      tokenAccountFromPubkey,
      ammoMint,
      gameId,
      gameState,
      input
    );

    ixs.push(ix_1);

    return { type: "Success" as const, ixs };
  }

  // OK
  async ixWarpToCoordinate(
    fleetPubkey: PublicKey,
    distanceCoords: [BN, BN],
    from: SectorCoordinates,
    to: SectorCoordinates
  ) {
    const ixs: InstructionReturn[] = [];

    // Check connection and game state
    const connectionAndGameState = await checkConnectionAndGameState(
      this._gameHandler
    );
    if (connectionAndGameState.type !== "Success")
      return connectionAndGameState;

    // Get all fleet data
    const fleetAccount = await this.getFleetAccount(fleetPubkey);
    if (fleetAccount.type !== "Success") return fleetAccount;
    if (!fleetAccount.fleet.state.Idle)
      return { type: "FleetIsNotIdle" as const };

    const sectorFrom = fleetAccount.fleet.state.Idle
      .sector as SectorCoordinates;
    const sectorTo: [BN, BN] = [
      sectorFrom[0].add(distanceCoords[0]),
      sectorFrom[1].add(distanceCoords[1]),
    ];

    if (
      !from[0].eq(sectorFrom[0]) ||
      !from[1].eq(sectorFrom[1]) ||
      !to[0].eq(sectorTo[0]) ||
      !to[1].eq(sectorTo[1])
    )
      return { type: "InvalidWarp" as const };

    console.log(`Warp from - X: ${sectorFrom[0]} | Y: ${sectorFrom[1]}`);
    console.log(`Warp to - X: ${sectorTo[0]} | Y: ${sectorTo[1]}`);

    if (sectorFrom[0].eq(sectorTo[0]) && sectorFrom[1].eq(sectorTo[1]))
      return { type: "WarpNotNeeded" as const };

    const warpInfo = this.getTimeToWarp(
      fleetAccount.fleet,
      sectorFrom,
      sectorTo
    );

    const gameFuelMint = this._gameHandler.game?.data.mints.fuel as PublicKey;

    const program = this._gameHandler.program;
    const key = this._gameHandler.funder;
    const playerProfile = fleetAccount.fleet.data.ownerProfile;
    const profileFaction =
      this._gameHandler.getProfileFactionAddress(playerProfile);
    const fleetKey = fleetPubkey;
    const fleetFuelTank = fleetAccount.fleet.data.fuelTank;
    const fuelCargoType = this._gameHandler.getCargoTypeAddress(gameFuelMint);
    const cargoStatsDefinition = this._gameHandler
      .cargoStatsDefinition as PublicKey;
    const tokenMint = gameFuelMint;
    const tokenFrom = getAssociatedTokenAddressSync(
      tokenMint,
      fleetFuelTank,
      true
    );
    const gameState = this._gameHandler.gameState as PublicKey;
    const gameId = this._gameHandler.gameId as PublicKey;
    const cargoProgram = this._gameHandler.cargoProgram;
    const input = {
      keyIndex: 0,
      toSector: sectorTo,
    } as WarpToCoordinateInput;

    const ix_1 = Fleet.warpToCoordinate(
      program,
      key,
      playerProfile,
      profileFaction,
      fleetKey,
      fleetFuelTank,
      fuelCargoType,
      cargoStatsDefinition,
      tokenFrom,
      tokenMint,
      gameState,
      gameId,
      cargoProgram,
      input
    );

    ixs.push(ix_1);

    return {
      type: "Success" as const,
      ixs,
      timeToWarp: warpInfo.timeToWarp,
      warpCooldown: warpInfo.warpCooldown,
    };
  }

  // FIX - WIP
  async ixReadyToExitWarp(fleetPubkey: PublicKey) {
    const ixs: InstructionReturn[] = [];
    const ix_1 = Fleet.moveWarpHandler(this._gameHandler.program, fleetPubkey);

    ixs.push(ix_1);

    return { type: "Success" as const, ixs };
  }

  // OK
  getTimeToWarp(
    fleet: Fleet,
    coordinatesFrom: [BN, BN],
    coordinatesTo: [BN, BN]
  ) {
    const fleetStats = fleet.data.stats as ShipStats;

    const timeToWarp = Fleet.calculateWarpTimeWithCoords(
      fleetStats,
      coordinatesFrom,
      coordinatesTo
    );

    return { timeToWarp, warpCooldown: fleetStats.movementStats.warpCoolDown };
  }

  // OK
  getTimeToSubwarp(
    fleet: Fleet,
    coordinatesFrom: [BN, BN],
    coordinatesTo: [BN, BN]
  ) {
    const fleetStats = fleet.data.stats as ShipStats;

    const timeToSubwarp = Fleet.calculateSubwarpTimeWithCoords(
      fleetStats,
      coordinatesFrom,
      coordinatesTo
    );

    return timeToSubwarp;
  }

  // OK
  async ixSubwarpToCoordinate(
    fleetPubkey: PublicKey,
    distanceCoords: [BN, BN],
    from: SectorCoordinates,
    to: SectorCoordinates
  ) {
    const ixs: InstructionReturn[] = [];

    // Check connection and game state
    const connectionAndGameState = await checkConnectionAndGameState(
      this._gameHandler
    );
    if (connectionAndGameState.type !== "Success")
      return connectionAndGameState;

    // Get all fleet data
    const fleetAccount = await this.getFleetAccount(fleetPubkey);
    if (fleetAccount.type !== "Success") return fleetAccount;
    if (!fleetAccount.fleet.state.Idle)
      return { type: "FleetIsNotIdle" as const };

    const sectorFrom = fleetAccount.fleet.state.Idle
      .sector as SectorCoordinates;
    const sectorTo: SectorCoordinates = [
      sectorFrom[0].add(distanceCoords[0]),
      sectorFrom[1].add(distanceCoords[1]),
    ];

    if (
      !from[0].eq(sectorFrom[0]) ||
      !from[1].eq(sectorFrom[1]) ||
      !to[0].eq(sectorTo[0]) ||
      !to[1].eq(sectorTo[1])
    )
      return { type: "InvalidSubwarp" as const };

    console.log(`Subwarp from - X: ${sectorFrom[0]} | Y: ${sectorFrom[1]}`);
    console.log(`Subwarp to - X: ${sectorTo[0]} | Y: ${sectorTo[1]}`);

    if (sectorFrom[0].eq(sectorTo[0]) && sectorFrom[1].eq(sectorTo[1]))
      return { type: "SubwarpNotNeeded" as const };

    const timeToSubwarp = this.getTimeToSubwarp(
      fleetAccount.fleet,
      sectorFrom,
      sectorTo
    );

    const program = this._gameHandler.program;
    const key = this._gameHandler.funder;
    const playerProfile = fleetAccount.fleet.data.ownerProfile;
    const profileFaction =
      this._gameHandler.getProfileFactionAddress(playerProfile);
    const fleetKey = fleetPubkey;
    const gameState = this._gameHandler.gameState as PublicKey;
    const gameId = this._gameHandler.gameId as PublicKey;
    const input = {
      keyIndex: 0,
      toSector: sectorTo,
    } as StartSubwarpInput;

    const ix_1 = Fleet.startSubwarp(
      program,
      key,
      playerProfile,
      profileFaction,
      fleetKey,
      gameId,
      gameState,
      input
    );

    ixs.push(ix_1);

    return {
      type: "Success" as const,
      ixs,
      timeToSubwarp,
    };
  }

  // OK
  async ixReadyToExitSubwarp(fleetPubkey: PublicKey) {
    const ixs: InstructionReturn[] = [];

    // Check connection and game state
    const connectionAndGameState = await checkConnectionAndGameState(
      this._gameHandler
    );
    if (connectionAndGameState.type !== "Success")
      return connectionAndGameState;

    // Get all fleet data
    const fleetAccount = await this.getFleetAccount(fleetPubkey);
    if (fleetAccount.type !== "Success") return fleetAccount;
    if (!fleetAccount.fleet.state.MoveSubwarp)
      return { type: "FleetIsNotSubwarp" as const };

    const gameFuelMint = this._gameHandler.game?.data.mints.fuel as PublicKey;

    const program = this._gameHandler.program;
    const playerProfile = fleetAccount.fleet.data.ownerProfile;
    const fleetKey = fleetPubkey;
    const fleetFuelTank = fleetAccount.fleet.data.fuelTank;
    const fuelCargoType = this._gameHandler.getCargoTypeAddress(gameFuelMint);
    const cargoStatsDefinition = this._gameHandler
      .cargoStatsDefinition as PublicKey;
    const tokenMint = gameFuelMint;
    const tokenFrom = getAssociatedTokenAddressSync(
      tokenMint,
      fleetFuelTank,
      true
    );
    const gameState = this._gameHandler.gameState as PublicKey;
    const gameId = this._gameHandler.gameId as PublicKey;
    const cargoProgram = this._gameHandler.cargoProgram;

    const ix_1 = Fleet.movementSubwarpHandler(
      program,
      cargoProgram,
      playerProfile,
      fleetKey,
      fleetFuelTank,
      fuelCargoType,
      cargoStatsDefinition,
      tokenFrom,
      tokenMint,
      gameId,
      gameState
    );

    ixs.push(ix_1);

    return { type: "Success" as const, ixs };
  }
}
