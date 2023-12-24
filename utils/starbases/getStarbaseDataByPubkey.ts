import { PublicKey } from "@solana/web3.js";
import { SageFleetHandler } from "../../src/SageFleetHandler";

export const getStarbaseDataByPubkey = async (
  starbasePubkey: PublicKey,
  fh: SageFleetHandler
) => {
  const starbaseAccount = await fh.getStarbaseAccount(starbasePubkey);

  if (starbaseAccount.type !== "Success") return starbaseAccount;

  return { type: "Success", starbase: starbaseAccount.starbase };
};
