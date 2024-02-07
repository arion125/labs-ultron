import { AnchorProvider, Program, Wallet } from "@project-serum/anchor"
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { readFromRPCOrError, readAllFromRPC } from "@staratlas/data-source";
import { PLAYER_PROFILE_IDL, PlayerProfile, PlayerProfileIDL } from "@staratlas/player-profile";
import { Fleet, Game, GameState, Planet, SAGE_IDL, SageIDL, SagePlayerProfile, Sector, Star, Starbase } from "@staratlas/sage";
import { SectorCoordinates } from "../common/types";

export class SageGame {
    static readonly SAGE_PROGRAM_ID = "SAGEqqFewepDHH6hMDcmWy7yjHPpyKLDnRXKb3Ki8e6";
    static readonly PLAYER_PROFILE_PROGRAM_ID = "pprofELXjL5Kck7Jn5hCpwAL82DpTkSYBENzahVtbc9";

    private provider: AnchorProvider;
    
    private sageProgram: Program<SageIDL>;
    private playerProfileProgram: Program<PlayerProfileIDL>;

    private gameId: PublicKey;

    constructor(signer: Keypair, connection: Connection) {
        this.provider = new AnchorProvider(
            connection,
            new Wallet(signer),
            AnchorProvider.defaultOptions()
        );
        this.sageProgram = new Program(
            SAGE_IDL,
            new PublicKey(SageGame.SAGE_PROGRAM_ID),
            this.provider
        );
        this.playerProfileProgram = new Program(
            PLAYER_PROFILE_IDL,
            new PublicKey(SageGame.PLAYER_PROFILE_PROGRAM_ID),
            this.provider
        );
    }

    // TODO: all "static" SAGE data should be fetched only one time and stored in attributes of this class

    // Game Account - only one per game
    async getGameAccount() {
        try {
          const [game] = await readAllFromRPC(
            this.provider.connection,
            this.sageProgram,
            Game,
            "confirmed"
          );
          return { type: "Success" as const, game };
        } catch (e) {
          return { type: "GameNotFound" as const };
        }
    }

    // Game State Account - only one per game
    async getGameStateAccount() {
        try {
          const [gameState] = await readAllFromRPC(
            this.provider.connection,
            this.sageProgram,
            GameState,
            "confirmed"
          );
          return { type: "Success" as const, gameState };
        } catch (e) {
          return { type: "GameStateNotFound" as const };
        }
    }

    // All 51 Sector Accounts
    async getAllSectorsAccount() {
        try {
          const fetchSectors = await readAllFromRPC(
            this.provider.connection,
            this.sageProgram,
            Sector,
            "confirmed"
          );

          const sectors = fetchSectors.flatMap((sector) =>
            sector.type === "ok" ? [sector.data] : []
          );

          return { type: "Success" as const, sectors };
        } catch (e) {
          return { type: "SectorsNotFound" as const };
        }
    }

    // All Star Accounts
    async getAllStarsAccount() {
      try {
        const fetchStars = await readAllFromRPC(
          this.provider.connection,
          this.sageProgram,
          Star,
          "confirmed"
        );

        const stars = fetchStars.flatMap((star) =>
        star.type === "ok" ? [star.data] : []
        );
        
        return { type: "Success" as const, stars };
      } catch (e) {
        return { type: "StarsNotFound" as const };
      }
    }

    // All Planet Accounts
    async getAllPlanetsAccount() {
      try {
        const fetchPlanets = await readAllFromRPC(
          this.provider.connection,
          this.sageProgram,
          Planet,
          "confirmed"
        );

        const planets = fetchPlanets.flatMap((planet) =>
        planet.type === "ok" ? [planet.data] : []
        );
        
        return { type: "Success" as const, planets };
      } catch (e) {
        return { type: "PlanetsNotFound" as const };
      }
    }

    // All 51 Starbase Accounts
    async getAllStarbasesAccount() {
      try {
        const fetchStarbases = await readAllFromRPC(
          this.provider.connection,
          this.sageProgram,
          Starbase,
          "confirmed"
        );

        const starbases = fetchStarbases.flatMap((starbase) =>
        starbase.type === "ok" ? [starbase.data] : []
        );
        
        return { type: "Success" as const, starbases };
      } catch (e) {
        return { type: "StarbasesNotFound" as const };
      }
    }

    // Resource Account

    // MineItem Account


    // Player Profile Account
    async getPlayerProfileAccount(playerProfilePublicKey: PublicKey) {
        try {
            const playerProfileAccount = await readFromRPCOrError(
            this.provider.connection,
            this.playerProfileProgram,
            playerProfilePublicKey,
            PlayerProfile,
            "confirmed"
            );
        
            return { type: "Success" as const, playerProfileAccount };
        } catch (e) {
            return { type: "PlayerProfileNotFound" as const };
        }
    }

    // SagePlayerProfile Account

    // Sector Account
    async getSectorAccount(sectorCoordinates?: SectorCoordinates, sectorPublicKey?: PublicKey) {
      const pbk = sectorCoordinates ? Starbase.findAddress(this.sageProgram, this.gameId, sectorCoordinates)[0] : sectorPublicKey ? sectorPublicKey : undefined;
      try {
        if (!pbk) throw new Error();
        const sectorAccount = await readFromRPCOrError(
          this.provider.connection,
          this.sageProgram,
          pbk,
          Sector,
          "confirmed"
        );
        return { type: "Success" as const, sectorAccount };
      } catch (e) {
        return { type: "SectorNotFound" as const };
      }
    }

    // Starbase Account
    async getStarbaseAccount(sectorCoordinates?: SectorCoordinates, starbasePublicKey?: PublicKey) {
      const pbk = sectorCoordinates ? Starbase.findAddress(this.sageProgram, this.gameId, sectorCoordinates)[0] : starbasePublicKey ? starbasePublicKey : undefined;
      try {
        if (!pbk) throw new Error();
        const starbaseAccount = await readFromRPCOrError(
          this.provider.connection,
          this.sageProgram,
          pbk,
          Starbase,
          "confirmed"
        );
        return { type: "Success" as const, starbaseAccount };
      } catch (e) {
        return { type: "StarbaseNotFound" as const };
      }
    }

    // Starbase Player Account

    // Fleet Account
    async getFleetAccount(fleetPublicKey: PublicKey) {
        try {
          const fleetAccount = await readFromRPCOrError(
            this.provider.connection,
            this.sageProgram,
            fleetPublicKey,
            Fleet,
            "confirmed"
          );
          return { type: "Success" as const, fleetAccount };
        } catch (e) {
          return { type: "FleetNotFound" as const };
        }
    }

    
    // SurveyDataUnitTracker Account

}