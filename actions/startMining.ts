import { PublicKey } from "@solana/web3.js";
import { SageFleetHandler } from "../src/SageFleetHandler";
import { SageGameHandler } from "../src/SageGameHandler";
import { wait } from "../utils/actions/wait";

export const startMining = async (
  fleetPubkey: PublicKey,
  resource: string,
  time: number,
  gh: SageGameHandler,
  fh: SageFleetHandler
) => {
  console.log(" ");
  console.log(`Start mining ${resource}...`);

  let ix = await fh.ixStartMining(fleetPubkey, resource);
  if (ix.type !== "Success") {
    throw new Error(ix.type);
  }

  await gh.sendDynamicTransactions(ix.ixs, true);

  console.log(`Mining started! Waiting for ${time} seconds...`);
  await gh.getQuattrinoBalance();
  await wait(time);
};
