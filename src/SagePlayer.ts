import { PublicKey } from "@solana/web3.js";
import { SageGame } from "./SageGame";
import { PlayerProfile } from "@staratlas/player-profile";
import { readFromRPCOrError, readAllFromRPC, stringToByteArray } from "@staratlas/data-source";
import { Fleet, SagePlayerProfile } from "@staratlas/sage";

export class SagePlayer {

    private sageGame: SageGame;
    private playerProfilePublicKey!: PublicKey;
    private playerProfileAccount!: PlayerProfile;
    private sagePlayerProfiles!: SagePlayerProfile[]; // player specific data in sage

    private constructor(sageGame: SageGame) {
        this.sageGame = sageGame;
    }

    static async init(sageGame: SageGame): Promise<SagePlayer> {
        const player = new SagePlayer(sageGame);
        
        const playerProfilePublicKey = await player.getPlayerProfileAddress(sageGame.getPlayerKeypair().publicKey);
        if (playerProfilePublicKey.type === "PlayerProfileAddressNotFound") throw new Error(playerProfilePublicKey.type);

        const playerProfileAccount = await player.getPlayerProfileAccountAsync(playerProfilePublicKey.playerProfilePublicKey);
        if (playerProfileAccount.type === "PlayerProfileNotFound") throw new Error(playerProfileAccount.type);

        const sagePlayerProfiles = await player.findAllSagePlayerProfilesByPlayerProfile(playerProfilePublicKey.playerProfilePublicKey);
        if (sagePlayerProfiles.type === "SagePlayerProfilesNotFound") throw new Error(sagePlayerProfiles.type);

        player.playerProfilePublicKey = playerProfilePublicKey.playerProfilePublicKey;
        player.playerProfileAccount = playerProfileAccount.playerProfileAccount;
        player.sagePlayerProfiles = sagePlayerProfiles.sagePlayerProfiles;
        
        return player;
    }

    // Step 1: Get the Player Profile Address from the player public key
    async getPlayerProfileAddress(playerPublicKey: PublicKey) {
        const [accountInfo] = await this.sageGame.getProvider().connection.getProgramAccounts(
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
          
        if (accountInfo) {
            return { type: "Success" as const, playerProfilePublicKey: accountInfo.pubkey };
        } else {
            return { type: "PlayerProfileAddressNotFound" as const}
        }
    }
  
    // Step 2. Get Player Profile Account
    async getPlayerProfileAccountAsync(playerProfilePublicKey: PublicKey) {
        try {
            const playerProfileAccount = await readFromRPCOrError(
            this.sageGame.getProvider().connection,
            this.sageGame.getPlayerProfileProgram(),
            playerProfilePublicKey,
            PlayerProfile,
            "confirmed"
            );
        
            return { type: "Success" as const, playerProfileAccount };
        } catch (e) {
            return { type: "PlayerProfileNotFound" as const };
        }
    }

    // Step 3A. Get all the SagePlayerProfile Accounts from the player profile public key
    async findAllSagePlayerProfilesByPlayerProfile(playerProfilePublicKey: PublicKey) {
      try {  
        const fetchSagePlayerProfiles = await readAllFromRPC(
          this.sageGame.getProvider().connection,
          this.sageGame.getSageProgram(),
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

    getPlayerProfilePublicKey() {
        return this.playerProfilePublicKey;
    }

    getPlayerProfileAccount() {
        return this.playerProfileAccount;
    }

    getSagePlayerProfiles() {
        return this.sagePlayerProfiles;
    }

    // Step 3B. Get all fleets owned by a player profile
    async findAllFleetsByPlayerProfile(playerProfilePublicKey: PublicKey) {
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
}