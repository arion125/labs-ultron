import { BN } from "@project-serum/anchor";
import { sageProvider } from "../sageProvider";

export const getStarbaseDataByCoords = async (coordinates: [BN, BN]) => {
  const { sageGameHandler, sageFleetHandler } = await sageProvider();

  const starbasePubkey = sageGameHandler.getStarbaseAddress(coordinates);
  const starbaseAccount = await sageFleetHandler.getStarbaseAccount(
    starbasePubkey
  );

  if (starbaseAccount.type !== "Success") return starbaseAccount;

  return { starbasePubkey, starbase: starbaseAccount.starbase };
};
