import { PublicKey } from "@solana/web3.js";
import { wait } from "../utils/actions/wait";
import { sageProvider } from "../utils/sageProvider";

export const startMining = async (
  fleetPubkey: PublicKey,
  resource: string,
  time: number
) => {
  const { sageGameHandler, sageFleetHandler } = await sageProvider();

  console.log(" ");
  console.log(`Start mining ${resource}...`);

  let ix = await sageFleetHandler.ixStartMining(fleetPubkey, resource);
  if (ix.type !== "Success") {
    throw new Error(ix.type);
  }

  await sageGameHandler.sendDynamicTransactions(ix.ixs, true);

  /* let tx = await buildAndSignTransactionAndCheck(ix.ixs, true);
  await sendTransactionAndCheck(tx, `Fleet failed to start mining ${resource}`); */
  console.log(`Mining started! Waiting for ${time} seconds...`);
  await sageGameHandler.getQuattrinoBalance();
  await wait(time);
};
