import { PublicKey } from "@solana/web3.js";
import { SageFleetHandler } from "../src/SageFleetHandler";
import { SageGameHandler } from "../src/SageGameHandler";
import { wait } from "../utils/actions/wait";

export const loadFuel = async (
  fleetPubkey: PublicKey,
  fuelAmount: number,
  gh: SageGameHandler,
  fh: SageFleetHandler
) => {
  console.log(" ");
  console.log("Loading fuel to fleet...");

  let ix = await fh.ixRefuelFleet(fleetPubkey, fuelAmount);

  switch (ix.type) {
    case "FleetFuelTankIsFull":
      console.log("Your fleet fuel tank is already full");
      return;
    default:
      if (ix.type !== "Success") {
        throw new Error(ix.type);
      }
  }

  if (ix.ixs.length > 1) {
    const tx = await gh.sendDynamicTransactions([ix.ixs[1]], true, [ix.ixs[0]]);

    if (tx.type !== "Success") {
      throw new Error(tx.type)
    }
  } else {
    const tx = await gh.sendDynamicTransactions(ix.ixs, true);

    if (tx.type !== "Success") {
      throw new Error(tx.type)
    }
  }

  console.log("Fleet fuel loaded!");
  gh.getQuattrinoBalance();
};
