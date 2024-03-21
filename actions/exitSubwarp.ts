import { PublicKey } from "@solana/web3.js";
import { SageFleetHandler } from "../src/SageFleetHandler";
import { SageGameHandler } from "../src/SageGameHandler";
import { wait } from "../utils/actions/wait";

export const exitSubwarp = async (
  fleetPubkey: PublicKey,
  gh: SageGameHandler,
  fh: SageFleetHandler
) => {
  console.log(" ");
  console.log(`Exiting subwarp...`);
  
  let ix = await fh.ixReadyToExitSubwarp(fleetPubkey);
  if (ix.type !== "Success") {
    throw new Error(ix.type);
  }

  const tx = await gh.sendDynamicTransactions(ix.ixs, false);
  if (tx.type !== "Success") {
    throw new Error(tx.type)
  }

  await wait(15);

  console.log(`Exit subwarp completed!`);
};
