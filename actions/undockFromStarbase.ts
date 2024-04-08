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

  const txs = await fleet.getSageGame().buildDynamicTransactions(ix.ixs, false);
  if (txs.type !== "Success") {
    console.log("Failed to build dynamic transactions");
    return;
  }

  await fleet.getSageGame().sendDynamicTransactions(txs.data);

  console.log("Fleet undocked!");
  await fleet.getSageGame().getQuattrinoBalance();
};
