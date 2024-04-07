import { Provider, AnchorProvider, Program, Wallet, BN } from "@staratlas/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { readFromRPCOrError, readAllFromRPC, stringToByteArray } from "@staratlas/data-source";
import { PLAYER_PROFILE_IDL, PlayerProfileIDLProgram } from "@staratlas/player-profile";
import { Fleet, Game, GameState, MineItem, Planet, Resource, SAGE_IDL, SageIDLProgram, SagePlayerProfile, SageProgram, Sector, Star, Starbase, getCargoPodsByAuthority } from "@staratlas/sage";
import { ProfileFactionIDLProgram, PROFILE_FACTION_IDL } from "@staratlas/profile-faction";
import { CargoIDLProgram, CARGO_IDL } from "@staratlas/cargo";
import { CraftingIDLProgram, CRAFTING_IDL } from "@staratlas/crafting";
import { PlayerProfile } from "@staratlas/player-profile";
import { SectorCoordinates } from "../common/types";
import { AsyncSigner, byteArrayToString, getParsedTokenAccountsByOwner, createAssociatedTokenAccountIdempotent, keypairToAsyncSigner } from "@staratlas/data-source";

export enum ResourceName {
  Food = "Food",
  Ammo = "Ammo",
  Fuel = "Fuel",
  Tool = "Tool",
  Arco = "Arco",
  Biomass = "Biomass",
  Carbon = "Carbon",
  Diamond = "Diamond",
  Hydrogen = "Hydrogen",
  IronOre = "IronOre",
  CopperOre = "CopperOre",
  Lumanite = "Lumanite",
  Rochinol = "Rochinol",
  Sdu = "Sdu",
  EnergySubstrate = "EnergySubstrate",
  Electromagnet = "Electromagnet",
  Framework = "Framework",
  PowerSource = "PowerSource",
  ParticleAccelerator = "ParticleAccelerator",
  RadiationAbsorber = "RadiationAbsorber",
  SuperConductor = "SuperConductor",
  StrangeEmitter = "StrangeEmitter",
  CrystalLattice = "CrystalLattice",
  CopperWire = "CopperWire",
  Copper = "Copper",
  Electronics = "Electronics",
  Graphene = "Graphene",
  Hydrocarbon = "Hydrocarbon",
  Iron = "Iron",
  Magnet = "Magnet",
  Polymer = "Polymer",
  Steel = "Steel",
}
export class SageGame {
    
    // Sage Programs
    private provider: Provider;
    
    static readonly SAGE_PROGRAM_ID = new PublicKey("SAGE2HAwep459SNq61LHvjxPk4pLPEJLoMETef7f7EE");
    static readonly PLAYER_PROFILE_PROGRAM_ID = new PublicKey("pprofELXjL5Kck7Jn5hCpwAL82DpTkSYBENzahVtbc9");
    static readonly PROFILE_FACTION_PROGRAM_ID = new PublicKey("pFACSRuobDmvfMKq1bAzwj27t6d2GJhSCHb1VcfnRmq");
    // static readonly PROFILE_VAULT_PROGRAM_ID = new PublicKey("pv1ttom8tbyh83C1AVh6QH2naGRdVQUVt3HY1Yst5sv");
    static readonly CARGO_PROGRAM_ID = new PublicKey("Cargo2VNTPPTi9c1vq1Jw5d3BWUNr18MjRtSupAghKEk");
    static readonly CRAFTING_PROGRAM_ID = new PublicKey("CRAFT2RPXPJWCEix4WpJST3E7NLf79GTqZUL75wngXo5");
    // static readonly POINTS_PROGRAM_ID = new PublicKey("")

    private sageProgram: SageIDLProgram;
    private playerProfileProgram: PlayerProfileIDLProgram;
    private profileFactionProgram: ProfileFactionIDLProgram;
    private cargoProgram: CargoIDLProgram;
    private craftingProgram: CraftingIDLProgram;

    private resourcesMint: Record<ResourceName, PublicKey> = {
      [ResourceName.Food]: new PublicKey("foodQJAztMzX1DKpLaiounNe2BDMds5RNuPC6jsNrDG"),
      [ResourceName.Ammo]: new PublicKey("ammoK8AkX2wnebQb35cDAZtTkvsXQbi82cGeTnUvvfK"),
      [ResourceName.Fuel]: new PublicKey("fueL3hBZjLLLJHiFH9cqZoozTG3XQZ53diwFPwbzNim"),
      [ResourceName.Tool]: new PublicKey("tooLsNYLiVqzg8o4m3L2Uetbn62mvMWRqkog6PQeYKL"),
      [ResourceName.Arco]: new PublicKey("ARCoQ9dndpg6wE2rRexzfwgJR3NoWWhpcww3xQcQLukg"),
      [ResourceName.Biomass]: new PublicKey("MASS9GqtJz6ABisAxcUn3FeR4phMqH1XfG6LPKJePog"),
      [ResourceName.Carbon]: new PublicKey("CARBWKWvxEuMcq3MqCxYfi7UoFVpL9c4rsQS99tw6i4X"),
      [ResourceName.Diamond]: new PublicKey("DMNDKqygEN3WXKVrAD4ofkYBc4CKNRhFUbXP4VK7a944"),
      [ResourceName.Hydrogen]: new PublicKey("HYDR4EPHJcDPcaLYUcNCtrXUdt1PnaN4MvE655pevBYp"),
      [ResourceName.IronOre]: new PublicKey("FeorejFjRRAfusN9Fg3WjEZ1dRCf74o6xwT5vDt3R34J"),
      [ResourceName.CopperOre]: new PublicKey("CUore1tNkiubxSwDEtLc3Ybs1xfWLs8uGjyydUYZ25xc"),
      [ResourceName.Lumanite]: new PublicKey("LUMACqD5LaKjs1AeuJYToybasTXoYQ7YkxJEc4jowNj"),
      [ResourceName.Rochinol]: new PublicKey("RCH1Zhg4zcSSQK8rw2s6rDMVsgBEWa4kiv1oLFndrN5"),
      [ResourceName.Sdu]: new PublicKey("SDUsgfSZaDhhZ76U3ZgvtFiXsfnHbf2VrzYxjBZ5YbM"),
      [ResourceName.EnergySubstrate]: new PublicKey("SUBSVX9LYiPrzHeg2bZrqFSDSKkrQkiCesr6SjtdHaX"),
      [ResourceName.Electromagnet]: new PublicKey("EMAGoQSP89CJV5focVjrpEuE4CeqJ4k1DouQW7gUu7yX"),
      [ResourceName.Framework]: new PublicKey("FMWKb7YJA5upZHbu5FjVRRoxdDw2FYFAu284VqUGF9C2"),
      [ResourceName.PowerSource]: new PublicKey("PoWRYJnw3YDSyXgNtN3mQ3TKUMoUSsLAbvE8Ejade3u"),
      [ResourceName.ParticleAccelerator]: new PublicKey("PTCLSWbwZ3mqZqHAporphY2ofio8acsastaHfoP87Dc"),
      [ResourceName.RadiationAbsorber]: new PublicKey("RABSXX6RcqJ1L5qsGY64j91pmbQVbsYRQuw1mmxhxFe"),
      [ResourceName.SuperConductor]: new PublicKey("CoNDDRCNxXAMGscCdejioDzb6XKxSzonbWb36wzSgp5T"),
      [ResourceName.StrangeEmitter]: new PublicKey("EMiTWSLgjDVkBbLFaMcGU6QqFWzX9JX6kqs1UtUjsmJA"),
      [ResourceName.CrystalLattice]: new PublicKey("CRYSNnUd7cZvVfrEVtVNKmXiCPYdZ1S5pM5qG2FDVZHF"),
      [ResourceName.CopperWire]: new PublicKey("cwirGHLB2heKjCeTy4Mbp4M443fU4V7vy2JouvYbZna"),
      [ResourceName.Copper]: new PublicKey("CPPRam7wKuBkYzN5zCffgNU17RKaeMEns4ZD83BqBVNR"),
      [ResourceName.Electronics]: new PublicKey("ELECrjC8m9GxCqcm4XCNpFvkS8fHStAvymS6MJbe3XLZ"),
      [ResourceName.Graphene]: new PublicKey("GRAPHKGoKtXtdPBx17h6fWopdT5tLjfAP8cDJ1SvvDn4"),
      [ResourceName.Hydrocarbon]: new PublicKey("HYCBuSWCJ5ZEyANexU94y1BaBPtAX2kzBgGD2vES2t6M"),
      [ResourceName.Iron]: new PublicKey("ironxrUhTEaBiR9Pgp6hy4qWx6V2FirDoXhsFP25GFP"),
      [ResourceName.Magnet]: new PublicKey("MAGNMDeDJLvGAnriBvzWruZHfXNwWHhxnoNF75AQYM5"),
      [ResourceName.Polymer]: new PublicKey("PoLYs2hbRt5iDibrkPT9e6xWuhSS45yZji5ChgJBvcB"),
      [ResourceName.Steel]: new PublicKey("STEELXLJ8nfJy3P4aNuGxyNRbWPohqHSwxY75NsJRGG"),
  };

    // CHECK: is ! safe here?
    private game!: Game;
    private gameState!: GameState;
    private sectors!: Sector[];
    private stars!: Star[];
    private planets!: Planet[];
    private mineItems!: MineItem[];
    private resources!: Resource[];
    private starbases!: Starbase[];

    private playerKeypair!: Keypair;
    private funder: AsyncSigner;
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
        this.funder = keypairToAsyncSigner(signer);
    }

    static async init(signer: Keypair, connection: Connection): Promise<SageGame> {
      const game = new SageGame(signer, connection);
      
      const [gameAccount, gameStateAccount, sectors, stars, planets, mineItems, resources, starbases] = await Promise.all([
        game.getGameAccount(),
        game.getGameStateAccount(),
        game.getAllSectorsAccount(),
        game.getAllStarsAccount(),
        game.getAllPlanetsAccount(),
        game.getAllMineItems(),
        game.getAllResources(),
        game.getAllStarbasesAccount()
      ]);

      if (gameAccount.type === "GameNotFound") throw new Error(gameAccount.type);
      if (gameStateAccount.type === "GameStateNotFound") throw new Error(gameStateAccount.type);
      if (sectors.type === "SectorsNotFound") throw new Error(sectors.type);
      if (stars.type === "StarsNotFound") throw new Error(stars.type);
      if (planets.type === "PlanetsNotFound") throw new Error(planets.type);
      if (mineItems.type === "MineItemsNotFound") throw new Error(mineItems.type);
      if (resources.type === "ResourcesNotFound") throw new Error(resources.type);
      if (starbases.type === "StarbasesNotFound") throw new Error(starbases.type);

      game.game = gameAccount.data;
      game.gameState = gameStateAccount.data;
      game.sectors = sectors.data;
      game.stars = stars.data;
      game.planets = planets.data;
      game.mineItems = mineItems.data;
      game.resources = resources.data;
      game.starbases = starbases.data;

      return game;
    }

    getAsyncSigner() {
      return this.funder;
    }

    getPlayerPublicKey() {
      return this.playerKeypair.publicKey;
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

    getResourcesMint() {
      return this.resourcesMint;
    }

    /** GAME */
    // Game Account - fetch only one per game
    private async getGameAccount() {
        try {
          const [fetchGame] = await readAllFromRPC(
            this.provider.connection,
            this.sageProgram,
            Game,
            "confirmed",
          );

          if (fetchGame.type !== "ok") throw new Error()

          return { type: "Success" as const, data: fetchGame.data };
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

          return { type: "Success" as const, data: fetchGameState.data };
        } catch (e) {
          return { type: "GameStateNotFound" as const };
        }
    }

    getGameState() {
      return this.gameState;
    }
    /** END GAME STATE */


    /** SECTORS */
    // All Sectors Account - fetch only one per game
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

          return { type: "Success" as const, data: sectors };
        } catch (e) {
          return { type: "SectorsNotFound" as const };
        }
    }

    getSectors() {
      return this.sectors;
    }

    async getSectorByCoordsOrKeyAsync(sector: SectorCoordinates | [BN,BN] | PublicKey) {
      const pbk = !(sector instanceof PublicKey) ? Sector.findAddress(this.sageProgram, this.game.key, sector)[0] : sector;
      try {
        const sectorAccount = await readFromRPCOrError(
          this.provider.connection,
          this.sageProgram,
          pbk,
          Sector,
          "confirmed"
        );
        return { type: "Success" as const, data: sectorAccount };
      } catch (e) {
        return { type: "SectorNotFound" as const };
      }
    }

    getSectorByCoordsOrKey(sector: SectorCoordinates | [BN,BN] | PublicKey) {
      const pbk = !(sector instanceof PublicKey) ? Sector.findAddress(this.sageProgram, this.game.key, sector)[0] : sector;
      const sect = this.sectors.find((sector) => sector.key.equals(pbk))
      if (sect) {
        return { type: "Success" as const, data: sect }; ;
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

        return { type: "Success" as const, data: stars };
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
        
        return { type: "Success" as const, data: planets };
      } catch (e) {
        return { type: "PlanetsNotFound" as const };
      }
    }

    getPlanets() {
      return this.planets;
    }

    private getPlanetByCoords(coordinates: SectorCoordinates | [BN,BN]) {
      return this.planets.find((planet) => planet.data.sector as SectorCoordinates === coordinates);
    }

    getPlanetBySector(sector: Sector) {
      const sect = this.sectors.find((sect) => sect.key.equals(sector.key))
      if (sect) {
        const planet = this.getPlanetByCoords(sect.data.coordinates as SectorCoordinates);

        if (planet) {
          return { type: "Success" as const, data: planet };
        } else {
          return { type: "PlanetNotFound" as const };
        }
      } else {
        return { type: "SectorNotFound" as const };
      }
    }
    /** END PLANETS */


    /** STARBASES */
    // All Starbases - fetch only one per game
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
        
        return { type: "Success" as const, data: starbases };
      } catch (e) {
        return { type: "StarbasesNotFound" as const };
      }
    }

    getStarbases() {
      return this.starbases;
    }

    async getStarbaseBySectorAsync(sector: Sector) {
      try {
        const sectorAccount = await this.getSectorByCoordsOrKeyAsync(sector.key)
        if (sectorAccount.type === "SectorNotFound") return sectorAccount.type;

        const pbk = Starbase.findAddress(this.sageProgram, this.game.key, sectorAccount.data.data.coordinates as [BN, BN])[0];

        const starbaseAccount = await readFromRPCOrError(
          this.provider.connection,
          this.sageProgram,
          pbk,
          Starbase,
          "confirmed"
        );
        return { type: "Success" as const, data: starbaseAccount };
      } catch (e) {
        return { type: "StarbaseNotFound" as const };
      }
    }

    getStarbaseBySector(sector: Sector) {
      const sect = this.sectors.find((sect) => sect.key.equals(sector.key))
      if (sect) {
        const pbk = Starbase.findAddress(this.sageProgram, this.game.key, sect.data.coordinates as [BN, BN])[0];
        const starbase = this.starbases.find((starbase) => starbase.key.equals(pbk))

        if (starbase) {
          return { type: "Success" as const, data: starbase };
        } else {
          return { type: "StarbaseNotFound" as const };
        }
      } else {
        return { type: "SectorNotFound" as const };
      }
    }

    async getStarbaseByCoordsOrKeyAsync(starbase: SectorCoordinates | [BN,BN] | PublicKey) {
      const pbk = !(starbase instanceof PublicKey) ? Starbase.findAddress(this.sageProgram, this.game.key, starbase)[0] : starbase;
      try {
        const starbaseAccount = await readFromRPCOrError(
          this.provider.connection,
          this.sageProgram,
          pbk,
          Starbase,
          "confirmed"
        );
        return { type: "Success" as const, data: starbaseAccount };
      } catch (e) {
        return { type: "StarbaseNotFound" as const };
      }
    }

    getStarbaseByCoordsOrKey(starbase: SectorCoordinates | [BN,BN] | PublicKey) {
      const pbk = !(starbase instanceof PublicKey) ? Starbase.findAddress(this.sageProgram, this.game.key, starbase)[0] : starbase;
      const starb = this.starbases.find((starbase) => starbase.key.equals(pbk))
      if (starb) {
        return { type: "Success" as const, data: starb }; ;
      } else {
        return { type: "StarbaseNotFound" as const };
      }
    }
    /** END STARBASES */


    /** MINE ITEMS */
    // Mine Item contains data about a resource in Sage (like hardness)
    // All Mine Items - fetch only one per game
    private async getAllMineItems() {
      try {
        const fetchMineItems = await readAllFromRPC(
          this.provider.connection,
          this.sageProgram,
          MineItem,
          "confirmed"
        );

        const mineItems = fetchMineItems.flatMap((mineItem) =>
        mineItem.type === "ok" ? [mineItem.data] : []
        );

        if (mineItems.length === 0) throw new Error();
        
        return { type: "Success" as const, data: mineItems };
      } catch (e) {
        return { type: "MineItemsNotFound" as const };
      }
    }

    getMineItems() {
      return this.mineItems;
    }

    private async getMineItemByKeyAsync(mineItemKey: PublicKey) { // UNUSED
      try {
          const mineItemAccount = await readFromRPCOrError(
          this.provider.connection,
          this.sageProgram,
          mineItemKey,
          MineItem,
          "confirmed"
          );
      
          return { type: "Success" as const, data: mineItemAccount };
      } catch (e) {
          return { type: "MineItemNotFound" as const };
      }
    }

    getMineItemByKey(mineItemKey: PublicKey) {
      const mineItem = this.mineItems.find((mineItem) => mineItem.key.equals(mineItemKey));
      if (mineItem) {
        return { type: "Success" as const, data: mineItem };
      }
      return { type: "MineItemNotFound" as const };
    }    
    
    getMineItemAddressByMint(mint: PublicKey) {
      const [mineItem] = MineItem.findAddress(this.sageProgram, this.game.key, mint);
      return mineItem;
    }
    /** END MINE ITEMS */


    /** RESOURCES */
    // Resource contains data about a resource in a planet (like richness or mining stats)
    private async getAllResources() {
      try {
        const fetchResources = await readAllFromRPC(
          this.provider.connection,
          this.sageProgram,
          Resource,
          "confirmed"
        );

        const resources = fetchResources.flatMap((resource) =>
        resource.type === "ok" ? [resource.data] : []
        );

        if (resources.length === 0) throw new Error();
        
        return { type: "Success" as const, data: resources };
      } catch (e) {
        return { type: "ResourcesNotFound" as const };
      }
    }

    getResources() {
      return this.resources;
    }

    async getResourceByKeyAsync(resourceKey: PublicKey) {
      try {
          const resourceAccount = await readFromRPCOrError(
          this.provider.connection,
          this.sageProgram,
          resourceKey,
          Resource,
          "confirmed"
          );

          return { type: "Success" as const, data: resourceAccount };
      } catch (e) {
          return { type: "ResourceNotFound" as const };
      }
    }

    getResourceByKey(resourceKey: PublicKey) {
      const resource = this.resources.find((resource) => resource.key.equals(resourceKey));
      if (resource) {
        return { type: "Success" as const, data: resource };
      }
      return { type: "ResourceNotFound" as const };
    } 

    getResourceByMineItemKeyAndPlanetKey(mineItem: PublicKey, planet: PublicKey) {
      const [resourceKey] = Resource.findAddress(this.sageProgram, mineItem, planet);
      const resource = this.getResourceByKey(resourceKey)
      return resource;
    }

    async getResourcesByPlanetAsync(planet: Planet) {
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
                bytes: planet.key.toBase58(),
              },
            },
          ]
        );

        const resources = fetchResources.flatMap((resource) =>
          resource.type === "ok" ? [resource.data] : []
        );

        if (resources.length === 0) throw new Error();
        
        return { type: "Success" as const, data: resources };
      } catch (e) {
        return { type: "ResourcesNotFound" as const };
      }
    }

    getResourcesByPlanet(planet: Planet) {
      const resources = this.resources.filter((resource) => resource.data.location.equals(planet.key));
      if (resources.length > 0) {
        return { type: "Success" as const, data: resources };
      }
      return { type: "ResourcesNotFound" as const };
    }

    getResourceName(resource: Resource) {
      const mineItem = this.getMineItemByKey(resource.data.mineItem);
      if (mineItem.type !== "Success") return mineItem;
      return { type: "Success" as const, data: byteArrayToString(mineItem.data.data.name) };
    }
    /** END RESOURCES */


    /** RESOURCES MINT */
    getResourceMintByName(resourceName: ResourceName) {
      return this.resourcesMint[resourceName];
    }
    /** END RESOURCES MINT */

    // SurveyDataUnitTracker Account
    // ...

    // Starbase Player Account


    /** PLAYER PROFILE */
    // Step 1: Get Player Profiles from the player public key
    async getPlayerProfilesAsync() {
      try {  
        const fetchPlayerProfiles = await readAllFromRPC(
          this.getProvider().connection,
          this.getPlayerProfileProgram(),
          PlayerProfile,
          "confirmed",
          [
            {
              memcmp: {
                offset: 30,
                bytes: this.getPlayerPublicKey().toBase58(),
              },
            },
          ]
        );
    
        const playerProfiles = fetchPlayerProfiles.flatMap((playerProfile) =>
        playerProfile.type === "ok" ? [playerProfile.data] : []
        );

        if (playerProfiles.length === 0) throw new Error();

        return { type: "Success" as const, data: playerProfiles };
      } catch (e) {
        return { type: "PlayerProfilesNotFound" as const };
      }
    }

    // Step 2. Get a Player Profile Account
    async getPlayerProfileAsync(playerProfilePublicKey: PublicKey) {
      try {
          const playerProfileAccount = await readFromRPCOrError(
          this.getProvider().connection,
          this.getPlayerProfileProgram(),
          playerProfilePublicKey,
          PlayerProfile,
          "confirmed"
          );
      
          return { type: "Success" as const, data: playerProfileAccount };
      } catch (e) {
          return { type: "PlayerProfileNotFound" as const };
      }
    }
    /** END PLAYER PROFILE */


    /** FLEET */
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

    async getFleetAccountAsync(fleetPublicKey: PublicKey) {
        try {
          const fleetAccount = await readFromRPCOrError(
            this.provider.connection,
            this.sageProgram,
            fleetPublicKey,
            Fleet,
            "confirmed"
          );
          return { type: "Success" as const, data: fleetAccount };
        } catch (e) {
          return { type: "FleetNotFound" as const };
        }
    }   
    /** END FLEET */

    // HELPERS
    async getParsedTokenAccountsByOwner(owner: PublicKey) {
      try {
        const data = await getParsedTokenAccountsByOwner(this.provider.connection, owner);
        return { type: "Success" as const, data };
      } catch (e) {
        return { type: "ParsedTokenAccountError" as const };
      }
    }

    ixCreateAssociatedTokenAccountIdempotent(owner: PublicKey, mint: PublicKey) {
      const associatedTokenAccount = createAssociatedTokenAccountIdempotent(
        mint,
        owner,
        true
      );
      const associatedTokenAccountKey = associatedTokenAccount.address;
      const associatedTokenAccountKeyIx = associatedTokenAccount.instructions;

      return { address: associatedTokenAccountKey, instruction: associatedTokenAccountKeyIx };
    }

    async getCargoPodsByAuthority(authority: PublicKey) {
      try {
        const fetchCargoPods = await getCargoPodsByAuthority(
          this.provider.connection,
          this.cargoProgram,
          authority
        );
  
        const cargoPods = fetchCargoPods.flatMap((pod) =>
          pod.type === "ok" ? [pod.data] : []
        );
  
        if (cargoPods.length == 0) return { type: "CargoPodsNotFound" as const };
  
        return { type: "Success" as const, data: cargoPods };
      } catch (e) {
        return { type: "CargoPodsNotFound" as const };
      }
    }

    async checkTokenAccountBalance(tokenAccountey: PublicKey,) {
      const tokenAccount = await this.connection.getTokenAccountBalance(
        tokenAccountey,
        'confirmed',
      );
      if (tokenAccount.value.uiAmount == null) {
        return { type: "TokenAccountShouldBeDefined" as const };
      } else {
        return { type: "Success" as const, data: tokenAccount.value.uiAmount };
      }
    };

    // END CLASS
}