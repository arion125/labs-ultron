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

  const txs = await fleet.getSageGame().buildDynamicTransactions(ix.ixs, false);
  if (txs.type !== "Success") {
    console.log("Failed to build dynamic transactions");
    return;
  }

  await fleet.getSageGame().sendDynamicTransactions(txs.data);

  console.log("Fleet docked!");
  await fleet.getSageGame().getQuattrinoBalance();
};
