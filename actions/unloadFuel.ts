import { BN } from "@staratlas/anchor";
import { SageFleet } from "../src/SageFleet";

export const unloadFuel = async (
  fleet: SageFleet,
  amount: BN
) => {
  console.log(" ");
  console.log("Unloading fuel to fleet...");

  let ix = await fleet.ixUnloadFuelTank(amount);

  if (ix.type !== "Success") {
    throw new Error(ix.type);
  }

  await gh.sendDynamicTransactions(ix.ixs, true);

  console.log("Fleet fuel unloaded!");
  await gh.getQuattrinoBalance();
};
