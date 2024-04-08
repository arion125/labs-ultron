import { wait } from "../utils/actions/wait";
import { SageFleet } from "../src/SageFleet";
import { BN } from "@staratlas/anchor";

export const loadFuel = async (
  fleet: SageFleet,
  amount: BN
) => {
  console.log(" ");
  console.log("Loading fuel to fleet...");

  let ix = await fleet.ixLoadFuelTank(amount);

  switch (ix.type) {
    case "FleetFuelTankIsFull":
      console.log("Your fleet fuel tank is already full");
      return;
    default:
      if (ix.type !== "Success") {
        throw new Error(ix.type);
      }
  }

  const txs = await fleet.getSageGame().buildDynamicTransactions(ix.ixs, false);
  if (txs.type !== "Success") {
    console.log("Failed to build dynamic transactions");
    return;
  }

  await fleet.getSageGame().sendDynamicTransactions(txs.data);

  console.log("Fleet fuel loaded!");
  await fleet.getSageGame().getQuattrinoBalance();
};
