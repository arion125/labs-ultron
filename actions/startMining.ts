import { wait } from "../utils/actions/wait";
import { ResourceName } from "../src/SageGame";
import { SageFleet } from "../src/SageFleet";

export const startMining = async (
  fleet: SageFleet,
  resourceName: ResourceName,
  time: number,
) => {
  console.log(" ");
  console.log(`Start mining ${resourceName}...`);

  let ix = await fleet.ixStartMining(resourceName);

  if (ix.type !== "Success") {
    throw new Error(ix.type);
  }

  await fleet.getSageGame().sendDynamicTransactions(ix.ixs, false);

  console.log(`Mining started! Waiting for ${time} seconds...`);
  await fleet.getSageGame().getQuattrinoBalance();
  await wait(time);
};
