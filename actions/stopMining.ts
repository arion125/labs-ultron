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

  await fleet.getSageGame().sendDynamicTransactions(ix.ixs, false);

  console.log(`Mining stopped!`);
  await fleet.getSageGame().getQuattrinoBalance();
};
