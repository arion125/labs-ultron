import { BN } from "@project-serum/anchor";
import { SageFleetHandler } from "../../src/SageFleetHandler";
import { SageGameHandler } from "../../src/SageGameHandler";

export const getStarbaseDataByCoords = async (
  coordinates: [BN, BN],
  gh: SageGameHandler,
  fh: SageFleetHandler
) => {
  const starbasePubkey = gh.getStarbaseAddress(coordinates);
  const starbaseAccount = await fh.getStarbaseAccount(starbasePubkey);

  if (starbaseAccount.type !== "Success") return starbaseAccount;

  return { starbasePubkey, starbase: starbaseAccount.starbase };
};
