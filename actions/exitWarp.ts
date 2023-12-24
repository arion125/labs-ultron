import { PublicKey } from "@solana/web3.js";
import { SageFleetHandler } from "../src/SageFleetHandler";
import { SageGameHandler } from "../src/SageGameHandler";

export const exitWarp = async (
  fleetPubkey: PublicKey,
  gh: SageGameHandler,
  fh: SageFleetHandler
) => {
  let ix = await fh.ixReadyToExitWarp(fleetPubkey);
  if (ix.type !== "Success") {
    throw new Error(ix.type);
  }

  await gh.sendDynamicTransactions(ix.ixs, false);

  console.log(" ");
  console.log(`Exit warp completed!`);
};
