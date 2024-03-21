import { PublicKey } from "@solana/web3.js";
import { SageFleetHandler } from "../src/SageFleetHandler";
import { SageGameHandler } from "../src/SageGameHandler";

export const dockToStarbase = async (
  fleetPubkey: PublicKey,
  gh: SageGameHandler,
  fh: SageFleetHandler
) => {
  console.log(" ");
  console.log("Docking to starbase...");

  let ix = await fh.ixDockToStarbase(fleetPubkey);
  if (ix.type !== "Success") {
    throw new Error(ix.type);
  }

  const tx = await gh.sendDynamicTransactions(ix.ixs, false);
  if (tx.type !== "Success") {
    throw new Error(tx.type)
  }

  console.log("Fleet docked!");
  // gh.getQuattrinoBalance();
};
