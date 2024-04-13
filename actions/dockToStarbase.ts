import { SageFleet } from "../src/SageFleet";

export const dockToStarbase = async (
  fleet: SageFleet
) => {
  console.log(" ");
  console.log("Docking to starbase...");

  let ix = await fleet.ixDockToStarbase();
  
  if (ix.type !== "Success") {
    throw new Error(ix.type);
  }

  await fleet.getSageGame().sendDynamicTransactions(ix.ixs, false);

  console.log("Fleet docked!");
  await fleet.getSageGame().getQuattrinoBalance();
};
