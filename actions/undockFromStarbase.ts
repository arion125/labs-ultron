import { SageFleet } from "../src/SageFleet";

export const undockFromStarbase = async (
  fleet: SageFleet
) => {
  console.log(" ");
  console.log("Undocking from starbase...");

  let ix = await fleet.ixUndockFromStarbase();

  if (ix.type !== "Success") {
    throw new Error(ix.type);
  }

  await fleet.getSageGame().sendDynamicTransactions(ix.ixs, false);

  console.log("Fleet undocked!");
  await fleet.getSageGame().getQuattrinoBalance();
};