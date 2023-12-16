import { PublicKey } from "@solana/web3.js";
import { sageProvider } from "../utils/sageProvider";

export const dockToStarbase = async (fleetPubkey: PublicKey) => {
  const { sageGameHandler, sageFleetHandler } = await sageProvider();

  console.log(" ");
  console.log("Docking to starbase...");

  let ix = await sageFleetHandler.ixDockToStarbase(fleetPubkey);
  if (ix.type !== "Success") {
    throw new Error(ix.type);
  }

  await sageGameHandler.sendDynamicTransactions(ix.ixs, true);

  /* let tx = await buildAndSignTransactionAndCheck(ix.ixs, true);
  await sendTransactionAndCheck(tx, "Fleet failed to dock to starbase"); */
  console.log("Fleet docked!");
  await sageGameHandler.getQuattrinoBalance();
};
