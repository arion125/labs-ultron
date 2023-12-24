import { PublicKey } from "@solana/web3.js";
import { SageFleetHandler } from "../../src/SageFleetHandler";
import { SageGameHandler } from "../../src/SageGameHandler";

export const getFleetAccountByName = async (
  fleetName: string,
  gh: SageGameHandler,
  fh: SageFleetHandler,
  profilePubkey: PublicKey
) => {
  const fleetPubkey = gh.getFleetAddress(profilePubkey, fleetName);

  const fleetAccount = await fh.getFleetAccount(fleetPubkey);
  return fleetAccount;
};
