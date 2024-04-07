import { PublicKey } from "@solana/web3.js";
import { SageFleetHandler } from "../src/SageFleetHandler";
import { SageGameHandler } from "../src/SageGameHandler";
import { wait } from "../utils/actions/wait";
import { SageFleet } from "../src/SageFleet";
import { BN } from "@staratlas/anchor";

export const loadFuel = async (
  fleet: SageFleet,
  fuelAmount: BN
) => {
  console.log(" ");
  console.log("Loading fuel to fleet...");

  let ix = await fleet.ixLoadFuel(fuelAmount);
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
  await wait(15);

  console.log("Fleet fuel loaded!");
  await gh.getQuattrinoBalance();
};
