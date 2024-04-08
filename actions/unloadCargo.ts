import { BN } from "@staratlas/anchor";
import { ResourceName } from "../src/SageGame";
import { SageFleet } from "../src/SageFleet";

export const unloadCargo = async (
  fleet: SageFleet,
  resourceName: ResourceName,
  amount: BN
) => {
  console.log(" ");
  console.log(`Unloading ${amount} ${resourceName} from fleet cargo...`);

  let ix = await fleet.ixLoadCargo(resourceName, amount);

  switch (ix.type) {
    default: {
      if (ix.type !== "Success") {
        throw new Error(ix.type);
      }
    }
  }

  const txs = await fleet.getSageGame().buildDynamicTransactions(ix.ixs, false);
  if (txs.type !== "Success") {
    console.log("Failed to build dynamic transactions");
    return;
  }

  await fleet.getSageGame().sendDynamicTransactions(txs.data);

  console.log("Fleet cargo unloaded!");
  await fleet.getSageGame().getQuattrinoBalance();
};
