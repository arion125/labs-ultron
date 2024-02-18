import { AnchorProvider, Program, Wallet, BN } from "@project-serum/anchor"
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { readFromRPCOrError, readAllFromRPC, stringToByteArray } from "@staratlas/data-source";
import { PLAYER_PROFILE_IDL, PlayerProfile, PlayerProfileIDL } from "@staratlas/player-profile";
import { Fleet, Game, GameState, MineItem, Planet, Resource, SAGE_IDL, SageIDL, SagePlayerProfile, Sector, Star, Starbase } from "@staratlas/sage";
import { ProfileFactionIDL, PROFILE_FACTION_IDL } from "@staratlas/profile-faction";
import { CargoIDL, CARGO_IDL } from "@staratlas/cargo";
import { CraftingIDL, CRAFTING_IDL } from "@staratlas/crafting";
import { SectorCoordinates } from "../common/types";

export class SageGame {
    
    // Sage Programs
    private provider: AnchorProvider;
    
    static readonly SAGE_PROGRAM_ID = "SAGEqqFewepDHH6hMDcmWy7yjHPpyKLDnRXKb3Ki8e6";
    static readonly PLAYER_PROFILE_PROGRAM_ID = "pprofELXjL5Kck7Jn5hCpwAL82DpTkSYBENzahVtbc9";
    static readonly PROFILE_FACTION_PROGRAM_ID = "pFACSRuobDmvfMKq1bAzwj27t6d2GJhSCHb1VcfnRmq";
    static readonly CARGO_PROGRAM_ID = "Cargo8a1e6NkGyrjy4BQEW4ASGKs9KSyDyUrXMfpJoiH";
    static readonly CRAFTING_PROGRAM_ID = "Craftf1EGzEoPFJ1rpaTSQG1F6hhRRBAf4gRo9hdSZjR";
    
    private sageProgram: Program<SageIDL>;
    private playerProfileProgram: Program<PlayerProfileIDL>;
    private profileFactionProgram: Program<ProfileFactionIDL>;
    private cargoProgram: Program<CargoIDL>;
    private craftingProgram: Program<CraftingIDL>;

    // CHECK: is ! safe here?
    private game!: Game;
    private gameState!: GameState;

    sectors!: Sector[];
    stars!: Star[];
    planets!: Planet[];
    starbases!: Starbase[];

    private constructor(signer: Keypair, connection: Connection) {
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
        this.profileFactionProgram = new Program(
          PROFILE_FACTION_IDL,
          new PublicKey(SageGame.PROFILE_FACTION_PROGRAM_ID),
          this.provider
        );
        this.cargoProgram = new Program(
          CARGO_IDL,
          new PublicKey(SageGame.CARGO_PROGRAM_ID),
          this.provider
        );
        this.craftingProgram = new Program(
          CRAFTING_IDL,
          new PublicKey(SageGame.CRAFTING_PROGRAM_ID),
          this.provider
        );
    }

    static async init (signer: Keypair, connection: Connection): Promise<SageGame> {
      const game = new SageGame(signer, connection);
      
      const [gameAccount, gameStateAccount, sectors, stars, planets, starbases] = await Promise.all([
        game.getGameAccount(),
        game.getGameStateAccount(),
        game.getAllSectorsAccount(),
        game.getAllStarsAccount(),
        game.getAllPlanetsAccount(),
        game.getAllStarbasesAccount()
      ]);

      if (gameAccount.type === "GameNotFound") throw new Error(gameAccount.type);
      if (gameStateAccount.type === "GameStateNotFound") throw new Error(gameStateAccount.type);
      if (sectors.type === "SectorsNotFound") throw new Error(sectors.type);
      if (stars.type === "StarsNotFound") throw new Error(stars.type);
      if (planets.type === "PlanetsNotFound") throw new Error(planets.type);
      if (starbases.type === "StarbasesNotFound") throw new Error(starbases.type);

      game.game = gameAccount.game;
      game.gameState = gameStateAccount.gameState;
      game.sectors = sectors.sectors;
      game.stars = stars.stars;
      game.planets = planets.planets;
      game.starbases = starbases.starbases;

      return game;
    }

    // TODO: all "static" SAGE data should be fetched only one time and stored in attributes of this class

    // Game Account - only one per game
    private async getGameAccount() {
        try {
          const [fetchGame] = await readAllFromRPC(
            this.provider.connection,
            this.sageProgram,
            Game,
            "confirmed"
          );

          if (fetchGame.type !== "ok") throw new Error()

          return { type: "Success" as const, game: fetchGame.data };
        } catch (e) {
          return { type: "GameNotFound" as const };
        }
    }

    // Game State Account - only one per game
    private async getGameStateAccount() {
        try {
          const [fetchGameState] = await readAllFromRPC(
            this.provider.connection,
            this.sageProgram,
            GameState,
            "confirmed"
          );

          if (fetchGameState.type !== "ok") throw new Error()

          return { type: "Success" as const, gameState: fetchGameState.data };
        } catch (e) {
          return { type: "GameStateNotFound" as const };
        }
    }

    // All 51 Sector Accounts - only one per game
    private async getAllSectorsAccount() {
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

          if (sectors.length === 0) throw new Error();

          return { type: "Success" as const, sectors };
        } catch (e) {
          return { type: "SectorsNotFound" as const };
        }
    }

    // All Star Accounts - only one per game
    private async getAllStarsAccount() {
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
        
        if (stars.length === 0) throw new Error();

        return { type: "Success" as const, stars };
      } catch (e) {
        return { type: "StarsNotFound" as const };
      }
    }

    // All Planet Accounts - only one per game
    private async getAllPlanetsAccount() {
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

        if (planets.length === 0) throw new Error();
        
        return { type: "Success" as const, planets };
      } catch (e) {
        return { type: "PlanetsNotFound" as const };
      }
    }

    // All 51 Starbase Accounts - only one per game
    private async getAllStarbasesAccount() {
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

        if (starbases.length === 0) throw new Error();
        
        return { type: "Success" as const, starbases };
      } catch (e) {
        return { type: "StarbasesNotFound" as const };
      }
    }

    // MineItem contains data about a resource in Sage (like hardness)
    getMineItemAddressByMint(mint: PublicKey) {
      const [mineItem] = MineItem.findAddress(this.sageProgram, this.game.key, mint);
      return mineItem;
    }

    // Resource contains data about a resource in a planet (like richness or mining stats)
    getResourceAddressByMineItemAndPlanet(mineItem: PublicKey, planet: PublicKey) {
      const [resource] = Resource.findAddress(this.sageProgram, mineItem, planet);
      return resource;
    }

    getFleetAddressByPlayerProfileAndFleetName(playerProfile: PublicKey, fleetName: string) {
      const fleetLabel = stringToByteArray(fleetName, 32);
      const [fleet] = Fleet.findAddress(
        this.sageProgram,
        this.game.key,
        playerProfile,
        fleetLabel
      );
  
      return fleet;
    }

    // Resource Account
    async getResourceAccount(resourcePublicKey: PublicKey) {
      try {
          const resourceAccount = await readFromRPCOrError(
          this.provider.connection,
          this.sageProgram,
          resourcePublicKey,
          Resource,
          "confirmed"
          );
      
          return { type: "Success" as const, resourceAccount };
      } catch (e) {
          return { type: "ResourceNotFound" as const };
      }
    }

    // MineItem Account
    async getMineItemAccount(mineItemPublicKey: PublicKey) {
      try {
          const mineItemAccount = await readFromRPCOrError(
          this.provider.connection,
          this.sageProgram,
          mineItemPublicKey,
          MineItem,
          "confirmed"
          );
      
          return { type: "Success" as const, mineItemAccount };
      } catch (e) {
          return { type: "MineItemNotFound" as const };
      }
    }

    // Step 1: Get the Player Profile Address from the player public key
    async getPlayerProfileAddress(playerPublicKey: PublicKey) {
      const [accountInfo] = await this.provider.connection.getProgramAccounts(
        new PublicKey(SageGame.PLAYER_PROFILE_PROGRAM_ID),
        {
          filters: [
            {
              memcmp: {
                offset: 30,
                bytes: playerPublicKey.toBase58(),
              },
            },
          ],
        }
      );
  
      return accountInfo.pubkey;
    }

    // Step 2. Get Player Profile Account
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

    // Sector Account
    async getSectorAccount(sector: SectorCoordinates | [BN,BN] | PublicKey) {
      const pbk = !(sector instanceof PublicKey) ? Starbase.findAddress(this.sageProgram, this.game.key, sector)[0] : sector;
      try {
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
    async getStarbaseAccount(sector: SectorCoordinates | [BN,BN] | PublicKey) {
      const pbk = !(sector instanceof PublicKey) ? Starbase.findAddress(this.sageProgram, this.game.key, sector)[0] : sector;
      try {
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

    // Step 3A. Get all the SagePlayerProfile Accounts from the player profile public key
    async findAllSagePlayerProfilesByPlayerProfile(playerProfilePublicKey: PublicKey) {
      try {  
        const fetchSagePlayerProfiles = await readAllFromRPC(
          this.provider.connection,
          this.sageProgram,
          SagePlayerProfile,
          "confirmed",
          [
            {
              memcmp: {
                offset: 9,
                bytes: playerProfilePublicKey.toBase58(),
              },
            },
          ]
        );
    
        const sagePlayerProfiles = fetchSagePlayerProfiles.flatMap((sagePlayerProfile) =>
          sagePlayerProfile.type === "ok" ? [sagePlayerProfile.data] : []
        );

        if (sagePlayerProfiles.length === 0) throw new Error();

        return { type: "Success" as const, sagePlayerProfiles };
      } catch (e) {
        return { type: "SagePlayerProfilesNotFound" as const };
      }
    }

    // Resources in a planet
    async findResourcesByPlanet(planetPublicKey: PublicKey) {
      try {
        const fetchResources = await readAllFromRPC(
          this.provider.connection,
          this.sageProgram,
          Resource,
          "confirmed",
          [
            {
              memcmp: {
                offset: 41,
                bytes: planetPublicKey.toBase58(),
              },
            },
          ]
        );

        const resources = fetchResources.flatMap((resource) =>
          resource.type === "ok" ? [resource.data] : []
        );

        if (resources.length === 0) throw new Error();
        
        return { type: "Success" as const, resources };
      } catch (e) {
        return { type: "ResourcesNotFound" as const };
      }
    }

    // Step 3B. Get all fleets owned by a player profile
    async findAllFleetsByPlayerProfile(playerProfilePublicKey: PublicKey) {
      try {  
        const fetchFleets = await readAllFromRPC(
          this.provider.connection,
          this.sageProgram,
          Fleet,
          "confirmed",
          [
            {
              memcmp: {
                offset: 41,
                bytes: playerProfilePublicKey.toBase58(),
              },
            },
          ]
        );
    
        const fleets = fetchFleets.flatMap((fleet) =>
          fleet.type === "ok" ? [fleet.data] : []
        );

        if (fleets.length === 0) throw new Error();

        return { type: "Success" as const, fleets };
      } catch (e) {
        return { type: "FleetsNotFound" as const };
      }
    }

    // SurveyDataUnitTracker Account

}