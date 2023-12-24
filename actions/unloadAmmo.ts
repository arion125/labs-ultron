import { PublicKey } from "@solana/web3.js";
import { SageFleetHandler } from "../src/SageFleetHandler";
import { SageGameHandler } from "../src/SageGameHandler";

export const unloadAmmo = async (
  fleetPubkey: PublicKey,
  ammoAmount: number,
  gh: SageGameHandler,
  fh: SageFleetHandler
) => {
  console.log(" ");
  console.log("Unloading ammo to fleet...");

  let ix = await fh.ixUnloadAmmoBanks(fleetPubkey, ammoAmount);
  if (ix.type !== "Success") {
    throw new Error(ix.type);
  }

  await gh.sendDynamicTransactions(ix.ixs, true);

  console.log("Fleet ammo unloaded!");
  await gh.getQuattrinoBalance();
};
