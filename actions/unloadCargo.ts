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

  await fleet.getSageGame().sendDynamicTransactions(ix.ixs, false);

  console.log("Fleet cargo unloaded!");
  await fleet.getSageGame().getQuattrinoBalance();
};
