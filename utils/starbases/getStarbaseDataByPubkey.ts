import { PublicKey } from "@solana/web3.js";
import { sageProvider } from "../sageProvider";

export const getStarbaseDataByPubkey = async (starbasePubkey: PublicKey) => {
  const { sageFleetHandler } = await sageProvider();

  const starbaseAccount = await sageFleetHandler.getStarbaseAccount(
    starbasePubkey
  );

  if (starbaseAccount.type !== "Success") return starbaseAccount;

  return { type: "Success", starbase: starbaseAccount.starbase };
};
