import { PublicKey } from "@solana/web3.js";
import { SageFleetHandler } from "../src/SageFleetHandler";
import { SageGameHandler } from "../src/SageGameHandler";

export const unloadFuel = async (
  fleetPubkey: PublicKey,
  fuelAmount: number,
  gh: SageGameHandler,
  fh: SageFleetHandler
) => {
  console.log(" ");
  console.log("Unloading fuel to fleet...");

  let ix = await fh.ixUnloadFuelTanks(fleetPubkey, fuelAmount);
  if (ix.type !== "Success") {
    throw new Error(ix.type);
  }

  const tx = await gh.sendDynamicTransactions(ix.ixs, true);
  if (tx.type !== "Success") {
    throw new Error(tx.type)
  }

  console.log("Fleet fuel unloaded!");
  // gh.getQuattrinoBalance();
};
