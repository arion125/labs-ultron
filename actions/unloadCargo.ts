import { BN } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { ResourceType } from "../common/resources";
import { SageFleetHandler } from "../src/SageFleetHandler";
import { SageGameHandler } from "../src/SageGameHandler";

export const unloadCargo = async (
  fleetPubkey: PublicKey,
  resourceName: ResourceType,
  amount: BN,
  gh: SageGameHandler,
  fh: SageFleetHandler
) => {
  console.log(" ");
  console.log(`Unloading ${amount} ${resourceName} from fleet cargo...`);

  const mintToken = gh.getResourceMintAddress(resourceName);

  let ix = await fh.ixWithdrawCargoFromFleet(fleetPubkey, mintToken, amount);
  switch (ix.type) {
    case "FleetCargoHoldTokenAccountNotFound": {
      return;
    }
    case "NoResourcesToWithdraw": {
      console.log(`No ${resourceName} to withdraw`);
      return;
    }
    default: {
      if (ix.type !== "Success") {
        throw new Error(ix.type);
      }
    }
  }

  const tx = await gh.sendDynamicTransactions(ix.ixs, true);
  if (tx.type !== "Success") {
    throw new Error(tx.type)
  }

  console.log("Fleet cargo unloaded!");
  // gh.getQuattrinoBalance();
};
