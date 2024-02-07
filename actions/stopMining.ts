import { PublicKey } from "@solana/web3.js";
import { SageFleetHandler } from "../src/SageFleetHandler";
import { SageGameHandler } from "../src/SageGameHandler";

export const stopMining = async (
  fleetPubkey: PublicKey,
  resource: string,
  gh: SageGameHandler,
  fh: SageFleetHandler
) => {
  console.log(" ");
  console.log(`Stop mining ${resource}...`);

  let ix = await fh.ixStopMining(fleetPubkey);
  if (ix.type !== "Success") {
    throw new Error(ix.type);
  }

  await gh.sendDynamicTransactions(ix.ixs, resource != "hydrogen");

  console.log(`Mining stopped!`);
  await gh.getQuattrinoBalance();
};
