import { PublicKey } from "@solana/web3.js";
import { SageGame } from "./SageGame";
import { PlayerProfile } from "@staratlas/player-profile";
import { ProfileFactionAccount } from "@staratlas/profile-faction";
import { readFromRPCOrError, readAllFromRPC, stringToByteArray } from "@staratlas/data-source";
import { Fleet, SagePlayerProfile, Starbase, StarbasePlayer } from "@staratlas/sage";

export class SagePlayer {

    private sageGame: SageGame;
    private playerProfile!: PlayerProfile;

    private constructor(sageGame: SageGame, playerProfile: PlayerProfile) {
        this.sageGame = sageGame;
        this.playerProfile = playerProfile;
    }

    static async init(sageGame: SageGame, playerProfile: PlayerProfile): Promise<SagePlayer> {
        return new SagePlayer(sageGame, playerProfile);
    }

    getPlayerProfile() {
      return this.playerProfile;
    }
    
    getSageGame() {
      return this.sageGame;
    }

    getProfileFactionAddress() {
      const [profileFaction] = ProfileFactionAccount.findAddress(
        this.sageGame.getPlayerProfileFactionProgram(),
        this.playerProfile.key
      );
  
      return profileFaction;
    }

    getSagePlayerProfileAddress() { 
      const [sagePlayerProfile] = SagePlayerProfile.findAddress(
        this.sageGame.getSageProgram(),
        this.playerProfile.key,
        this.sageGame.getGame().key
      );
  
      return sagePlayerProfile;
    }

    getStarbasePlayerAddress(
      starbase: Starbase
    ) { 
      const [starbasePlayer] = StarbasePlayer.findAddress(
        this.sageGame.getSageProgram(),
        starbase.key,
        this.getSagePlayerProfileAddress(),
        starbase.data.seqId
      );
  
      return starbasePlayer;
    }

    // Step 3B. Get all fleets owned by a player profile
    async getAllFleetsAsync() {
      try {  
        const fetchFleets = await readAllFromRPC(
          this.sageGame.getProvider().connection,
          this.sageGame.getSageProgram(),
          Fleet,
          "confirmed",
          [
            {
              memcmp: {
                offset: 41,
                bytes: this.playerProfile.key.toBase58(),
              },
            },
          ]
        );
    
        const fleets = fetchFleets.flatMap((fleet) =>
          fleet.type === "ok" ? [fleet.data] : []
        );

        if (fleets.length === 0) throw new Error();

        return { type: "Success" as const, data: fleets };
      } catch (e) {
        return { type: "FleetsNotFound" as const };
      }
    }

    async getFleetByKeyAsync(fleetKey: PublicKey) {
      try {
        const fleetAccount = await readFromRPCOrError(
          this.sageGame.getProvider().connection,
          this.sageGame.getSageProgram(),
          fleetKey,
          Fleet,
          "confirmed"
        );
        return { type: "Success" as const, data: fleetAccount };
      } catch (e) {
        return { type: "FleetNotFound" as const };
      }
    }
    
}