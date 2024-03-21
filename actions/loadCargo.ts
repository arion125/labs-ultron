import { PublicKey } from "@solana/web3.js";
import { ResourceType } from "../common/resources";
import { SageFleetHandler } from "../src/SageFleetHandler";
import { SageGameHandler } from "../src/SageGameHandler";

export const loadCargo = async (
  fleetPubkey: PublicKey,
  resourceName: ResourceType,
  amount: number,
  gh: SageGameHandler,
  fh: SageFleetHandler
) => {
  console.log(" ");
  console.log(`Loading ${amount} ${resourceName} to fleet cargo...`);

  const mintToken = gh.getResourceMintAddress(resourceName);

  let ix = await fh.ixDepositCargoToFleet(fleetPubkey, mintToken, amount);
  switch (ix.type) {
    case "FleetCargoIsFull":
      console.log("Your fleet cargo is full");
      return;
    default:
      if (ix.type !== "Success") {
        throw new Error(ix.type);
      }
  }

  const tx = await gh.sendDynamicTransactions(ix.ixs, true);
  if (tx.type !== "Success") {
    throw new Error(tx.type)
  }

  console.log("Fleet cargo loaded!");
  // gh.getQuattrinoBalance();
};
