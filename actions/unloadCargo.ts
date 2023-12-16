import { BN } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { ResourceType } from "../common/resources";
import { sageProvider } from "../utils/sageProvider";

export const unloadCargo = async (
  fleetPubkey: PublicKey,
  resourceName: ResourceType,
  amount: BN
) => {
  const { sageGameHandler, sageFleetHandler } = await sageProvider();

  console.log(" ");
  console.log(`Unloading ${amount} ${resourceName} from fleet cargo...`);

  const mintToken = sageGameHandler.getResourceMintAddress(resourceName);

  let ix = await sageFleetHandler.ixWithdrawCargoFromFleet(
    fleetPubkey,
    mintToken,
    amount
  );
  switch (ix.type) {
    case "FleetCargoHoldTokenAccountNotFound": {
      return;
    }
    default: {
      if (ix.type !== "Success") {
        throw new Error(ix.type);
      }
    }
  }

  await sageGameHandler.sendDynamicTransactions(ix.ixs, true);

  /* let tx = await buildAndSignTransactionAndCheck(ix.ixs, true);
  await sendTransactionAndCheck(tx, "Fleet failed to unload cargo"); */
  console.log("Fleet cargo unloaded!");
  await sageGameHandler.getQuattrinoBalance();
};
