import { PublicKey } from "@solana/web3.js";
import { sageProvider } from "../utils/sageProvider";

export const undockFromStarbase = async (fleetPubkey: PublicKey) => {
  const { sageGameHandler, sageFleetHandler } = await sageProvider();

  console.log(" ");
  console.log("Undocking from starbase...");

  let ix = await sageFleetHandler.ixUndockFromStarbase(fleetPubkey);
  if (ix.type !== "Success") {
    throw new Error(ix.type);
  }

  await sageGameHandler.sendDynamicTransactions(ix.ixs, true);

  /* let tx = await buildAndSignTransactionAndCheck(ix.ixs, true);
  await sendTransactionAndCheck(tx, "Fleet failed to undock from starbase"); */
  console.log("Fleet undocked!");
  await sageGameHandler.getQuattrinoBalance();
};
