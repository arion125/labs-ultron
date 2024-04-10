import { SageFleet } from "../src/SageFleet";
import { ResourceName } from "../src/SageGame";

export const stopMining = async (
  fleet: SageFleet,
  resourceName: ResourceName
) => {
  console.log(" ");
  console.log(`Stop mining ${resourceName}...`);

  let ix = await fleet.ixStopMining();

  if (ix.type !== "Success") {
    throw new Error(ix.type);
  }

  const txs = await fleet.getSageGame().buildDynamicTransactions(ix.ixs, false);
  if (txs.type !== "Success") {
    console.log("Failed to build dynamic transactions");
    return;
  }

  await fleet.getSageGame().sendDynamicTransactions(txs.data);

  console.log(`Mining stopped!`);
  await fleet.getSageGame().getQuattrinoBalance();
};
