import { PublicKey } from "@solana/web3.js";
import { sageProvider } from "../utils/sageProvider";

export const exitSubwarp = async (fleetPubkey: PublicKey) => {
  const { sageGameHandler, sageFleetHandler } = await sageProvider();

  let ix = await sageFleetHandler.ixReadyToExitSubwarp(fleetPubkey);
  if (ix.type !== "Success") {
    throw new Error(ix.type);
  }

  await sageGameHandler.sendDynamicTransactions(ix.ixs, false);

  console.log(" ");
  console.log(`Exit subwarp completed!`);
};
