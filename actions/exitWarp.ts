import { PublicKey } from "@solana/web3.js";
import { sageProvider } from "../utils/sageProvider";

// TODO: Need refactoring - current version is deprecated
export const exitWarp = async (fleetPubkey: PublicKey) => {
  const { sageFleetHandler, sageGameHandler } = await sageProvider();

  let ix = await sageFleetHandler.ixReadyToExitWarp(fleetPubkey);
  if (ix.type !== "Success") {
    throw new Error(ix.type);
  }

  await sageGameHandler.sendDynamicTransactions(ix.ixs, false);

  console.log(" ");
  console.log(`Exit warp completed!`);
};
