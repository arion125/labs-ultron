import { PublicKey } from "@solana/web3.js";
import { SageFleetHandler } from "../src/SageFleetHandler";
import { SageGameHandler } from "../src/SageGameHandler";

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

  await gh.sendDynamicTransactions(ix.ixs, true);

  console.log("Fleet fuel loaded!");
  await gh.getQuattrinoBalance();
};
