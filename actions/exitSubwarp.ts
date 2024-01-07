import { PublicKey } from "@solana/web3.js";
import { SageFleetHandler } from "../src/SageFleetHandler";
import { SageGameHandler } from "../src/SageGameHandler";
import { wait } from "../utils/actions/wait";

export const exitSubwarp = async (
  fleetPubkey: PublicKey,
  gh: SageGameHandler,
  fh: SageFleetHandler
) => {
  let ix = await fh.ixReadyToExitSubwarp(fleetPubkey);
  if (ix.type !== "Success") {
    throw new Error(ix.type);
  }

  await gh.sendDynamicTransactions(ix.ixs, false);
  await wait(15);

  console.log(" ");
  console.log(`Exit subwarp completed!`);
};
