import { AnchorProvider, Program, Wallet, BN } from "@project-serum/anchor"
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { readFromRPCOrError, readAllFromRPC, stringToByteArray } from "@staratlas/data-source";
import { PLAYER_PROFILE_IDL, PlayerProfileIDL } from "@staratlas/player-profile";
import { Fleet, Game, GameState, MineItem, Planet, Resource, SAGE_IDL, SageIDL, SagePlayerProfile, Sector, Star, Starbase } from "@staratlas/sage";
import { ProfileFactionIDL, PROFILE_FACTION_IDL } from "@staratlas/profile-faction";
import { CargoIDL, CARGO_IDL } from "@staratlas/cargo";
import { CraftingIDL, CRAFTING_IDL } from "@staratlas/crafting";
import { SectorCoordinates } from "../common/types";

interface ResourcesMint {
  [key: string]: PublicKey;
}

export class SageGame {
    
    // Sage Programs
    private provider: AnchorProvider;
    
    static readonly SAGE_PROGRAM_ID = new PublicKey("SAGEqqFewepDHH6hMDcmWy7yjHPpyKLDnRXKb3Ki8e6");
    static readonly PLAYER_PROFILE_PROGRAM_ID = new PublicKey("pprofELXjL5Kck7Jn5hCpwAL82DpTkSYBENzahVtbc9");
    static readonly PROFILE_FACTION_PROGRAM_ID = new PublicKey("pFACSRuobDmvfMKq1bAzwj27t6d2GJhSCHb1VcfnRmq");
    static readonly CARGO_PROGRAM_ID = new PublicKey("Cargo8a1e6NkGyrjy4BQEW4ASGKs9KSyDyUrXMfpJoiH");
    static readonly CRAFTING_PROGRAM_ID = new PublicKey("Craftf1EGzEoPFJ1rpaTSQG1F6hhRRBAf4gRo9hdSZjR");
    
    private sageProgram: Program<SageIDL>;
    private playerProfileProgram: Program<PlayerProfileIDL>;
    private profileFactionProgram: Program<ProfileFactionIDL>;
    private cargoProgram: Program<CargoIDL>;
    private craftingProgram: Program<CraftingIDL>;

    // Sage Resources Mint
    static readonly RESOURCES_MINT: ResourcesMint = {
      food: new PublicKey("foodQJAztMzX1DKpLaiounNe2BDMds5RNuPC6jsNrDG"),
      ammo: new PublicKey("ammoK8AkX2wnebQb35cDAZtTkvsXQbi82cGeTnUvvfK"),
      fuel: new PublicKey("fueL3hBZjLLLJHiFH9cqZoozTG3XQZ53diwFPwbzNim"),
      tool: new PublicKey("tooLsNYLiVqzg8o4m3L2Uetbn62mvMWRqkog6PQeYKL"),
      arco: new PublicKey("ARCoQ9dndpg6wE2rRexzfwgJR3NoWWhpcww3xQcQLukg"),
      biomass: new PublicKey("MASS9GqtJz6ABisAxcUn3FeR4phMqH1XfG6LPKJePog"),
      carbon: new PublicKey("CARBWKWvxEuMcq3MqCxYfi7UoFVpL9c4rsQS99tw6i4X"),
      diamond: new PublicKey("DMNDKqygEN3WXKVrAD4ofkYBc4CKNRhFUbXP4VK7a944"),
      hydrogen: new PublicKey("HYDR4EPHJcDPcaLYUcNCtrXUdt1PnaN4MvE655pevBYp"),
      iron_ore: new PublicKey("FeorejFjRRAfusN9Fg3WjEZ1dRCf74o6xwT5vDt3R34J"),
      copper_ore: new PublicKey("CUore1tNkiubxSwDEtLc3Ybs1xfWLs8uGjyydUYZ25xc"),
      lumanite: new PublicKey("LUMACqD5LaKjs1AeuJYToybasTXoYQ7YkxJEc4jowNj"),
      rochinol: new PublicKey("RCH1Zhg4zcSSQK8rw2s6rDMVsgBEWa4kiv1oLFndrN5"),
      sdu: new PublicKey("SDUsgfSZaDhhZ76U3ZgvtFiXsfnHbf2VrzYxjBZ5YbM"),
      energy_substrate: new PublicKey("SUBSVX9LYiPrzHeg2bZrqFSDSKkrQkiCesr6SjtdHaX"),
      electromagnet: new PublicKey("EMAGoQSP89CJV5focVjrpEuE4CeqJ4k1DouQW7gUu7yX"),
      framework: new PublicKey("FMWKb7YJA5upZHbu5FjVRRoxdDw2FYFAu284VqUGF9C2"),
      power_source: new PublicKey("PoWRYJnw3YDSyXgNtN3mQ3TKUMoUSsLAbvE8Ejade3u"),
      particle_accelerator: new PublicKey("PTCLSWbwZ3mqZqHAporphY2ofio8acsastaHfoP87Dc"),
      radiation_absorber: new PublicKey("RABSXX6RcqJ1L5qsGY64j91pmbQVbsYRQuw1mmxhxFe"),
      super_conductor: new PublicKey("CoNDDRCNxXAMGscCdejioDzb6XKxSzonbWb36wzSgp5T"),
      strange_emitter: new PublicKey("EMiTWSLgjDVkBbLFaMcGU6QqFWzX9JX6kqs1UtUjsmJA"),
      crystal_lattice: new PublicKey("CRYSNnUd7cZvVfrEVtVNKmXiCPYdZ1S5pM5qG2FDVZHF"),
      copper_wire: new PublicKey("cwirGHLB2heKjCeTy4Mbp4M443fU4V7vy2JouvYbZna"),
      copper: new PublicKey("CPPRam7wKuBkYzN5zCffgNU17RKaeMEns4ZD83BqBVNR"),
      electronics: new PublicKey("ELECrjC8m9GxCqcm4XCNpFvkS8fHStAvymS6MJbe3XLZ"),
      graphene: new PublicKey("GRAPHKGoKtXtdPBx17h6fWopdT5tLjfAP8cDJ1SvvDn4"),
      hydrocarbon: new PublicKey("HYCBuSWCJ5ZEyANexU94y1BaBPtAX2kzBgGD2vES2t6M"),
      iron: new PublicKey("ironxrUhTEaBiR9Pgp6hy4qWx6V2FirDoXhsFP25GFP"),
      magnet: new PublicKey("MAGNMDeDJLvGAnriBvzWruZHfXNwWHhxnoNF75AQYM5"),
      polymer: new PublicKey("PoLYs2hbRt5iDibrkPT9e6xWuhSS45yZji5ChgJBvcB"),
      steel: new PublicKey("STEELXLJ8nfJy3P4aNuGxyNRbWPohqHSwxY75NsJRGG"),
    };

    // CHECK: is ! safe here?
    private game!: Game;
    private gameState!: GameState;
    private sectors!: Sector[];
    private stars!: Star[];
    private planets!: Planet[];
    private starbases!: Starbase[];

    private playerKeypair!: Keypair;
    private connection!: Connection;

    private constructor(signer: Keypair, connection: Connection) {
        this.playerKeypair = signer;
        this.connection = connection;
        this.provider = new AnchorProvider(
            connection,
            new Wallet(signer),
            AnchorProvider.defaultOptions()
        );
        this.sageProgram = new Program(
            SAGE_IDL,
            SageGame.SAGE_PROGRAM_ID,
            this.provider
        );
        this.playerProfileProgram = new Program(
            PLAYER_PROFILE_IDL,
            SageGame.PLAYER_PROFILE_PROGRAM_ID,
            this.provider
        );
        this.profileFactionProgram = new Program(
          PROFILE_FACTION_IDL,
          SageGame.PROFILE_FACTION_PROGRAM_ID,
          this.provider
        );
        this.cargoProgram = new Program(
          CARGO_IDL,
          SageGame.CARGO_PROGRAM_ID,
          this.provider
        );
        this.craftingProgram = new Program(
          CRAFTING_IDL,
          SageGame.CRAFTING_PROGRAM_ID,
          this.provider
        );
    }

    static async init(signer: Keypair, connection: Connection): Promise<SageGame> {
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

    getPlayerKeypair() {
      return this.playerKeypair;
    }

    getConnection() {
      return this.connection;
    }

    getProvider() {
      return this.provider
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

    /** GAME */
    // Game Account - fetch only one per game
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

    getGame() {
      return this.game;
    }
    /** END GAME */


    /** GAME STATE */
    // Game State Account - fetch only one per game
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

    getGameState() {
      return this.gameState;
    }
    /** END GAME STATE */


    /** SECTORS */
    // All 51 Sectors Account - fetch only one per game
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

    getSectors() {
      return this.sectors;
    }

    async getSectorAccountAsync(sector: SectorCoordinates | [BN,BN] | PublicKey) {
      const pbk = !(sector instanceof PublicKey) ? Sector.findAddress(this.sageProgram, this.game.key, sector)[0] : sector;
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

    getSectorAccount(sector: SectorCoordinates | [BN,BN] | PublicKey) {
      const pbk = !(sector instanceof PublicKey) ? Sector.findAddress(this.sageProgram, this.game.key, sector)[0] : sector;
      const sect = this.sectors.find((sector) => sector.key.equals(pbk))
      if (sect) {
        return { type: "Success" as const, sectorAccount: sect }; ;
      } else {
        return { type: "SectorNotFound" as const };
      }
    }
    /** END SECTORS */


    /** STARS */
    // All Stars Account - fetch only one per game
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

    getStars() {
      return this.stars;
    }
    /** END STARS */


    /** PLANETS */
    // All Planets Account - fetch only one per game
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

    getPlanets() {
      return this.planets;
    }
    /** END PLANETS */


    /** STARBASES */
    // All 51 Starbases - fetch only one per game
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

    getStarbases() {
      return this.starbases;
    }

    async getStarbaseAccountBySectorAsync(sector: PublicKey) {
      try {
        const sectorAccount = await this.getSectorAccountAsync(sector)
        if (sectorAccount.type === "SectorNotFound") return sectorAccount.type;

        const pbk = Starbase.findAddress(this.sageProgram, this.game.key, sectorAccount.sectorAccount.data.coordinates as [BN, BN])[0];

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

    getStarbaseAccountBySector(sector: PublicKey) {
      const sect = this.sectors.find((sect) => sect.key.equals(sector))
      if (sect) {
        const pbk = Starbase.findAddress(this.sageProgram, this.game.key, sect.data.coordinates as [BN, BN])[0];
        const starbase = this.starbases.find((starbase) => starbase.key.equals(pbk))

        if (starbase) {
          return { type: "Success" as const, starbaseAccount: starbase };
        } else {
          return { type: "StarbaseNotFound" as const };
        }
      } else {
        return { type: "SectorNotFound" as const };
      }
    }

    async getStarbaseAccountAsync(starbase: SectorCoordinates | [BN,BN] | PublicKey) {
      const pbk = !(starbase instanceof PublicKey) ? Starbase.findAddress(this.sageProgram, this.game.key, starbase)[0] : starbase;
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

    getStarbaseAccount(starbase: SectorCoordinates | [BN,BN] | PublicKey) {
      const pbk = !(starbase instanceof PublicKey) ? Starbase.findAddress(this.sageProgram, this.game.key, starbase)[0] : starbase;
      const starb = this.starbases.find((starbase) => starbase.key.equals(pbk))
      if (starb) {
        return { type: "Success" as const, sectorAccount: starb }; ;
      } else {
        return { type: "StarbaseNotFound" as const };
      }
    }
    /** END STARBASES */


    /** MINE ITEMS */
    // Mine Item contains data about a resource in Sage (like hardness)
    async getMineItemAccountAsync(mineItemPublicKey: PublicKey) {
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

    getMineItemAddressByMint(mint: PublicKey) {
      const [mineItem] = MineItem.findAddress(this.sageProgram, this.game.key, mint);
      return mineItem;
    }
    /** END MINE ITEMS */


    /** RESOURCES */
    // Resource contains data about a resource in a planet (like richness or mining stats)
    async getResourceAccountAsync(resourcePublicKey: PublicKey) {
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

    getResourceAddressByMineItemAndPlanet(mineItem: PublicKey, planet: PublicKey) {
      const [resource] = Resource.findAddress(this.sageProgram, mineItem, planet);
      return resource;
    }

    async findResourcesAccountByPlanetAsync(planetPublicKey: PublicKey) {
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
    /** END RESOURCES */

    // SurveyDataUnitTracker Account
    // ...

    // END CLASS

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

    // Starbase Player Account

    // Fleet Account
    async getFleetAccountAsync(fleetPublicKey: PublicKey) {
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

}