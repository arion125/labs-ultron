import { BN } from "@staratlas/anchor";
import { ResourceName } from "../src/SageGame";
import { CargoPodType, SageFleet } from "../src/SageFleet";

export const unloadCargo = async (
  fleet: SageFleet,
  resourceName: ResourceName,
  cargoPodType: CargoPodType,
  amount: BN
) => {
  console.log(" ");
  console.log(`Unloading ${amount} ${resourceName} from fleet...`);

  let ix = await fleet.ixUnloadCargo(resourceName, cargoPodType, amount);

  switch (ix.type) {
    case "FleetCargoPodTokenAccountNotFound":
      console.log("Fleet cargo pod token account not found");
      return { type: "FleetCargoPodTokenAccountNotFound" as const };
    case "NoResourcesToWithdraw":
      console.log("No resources to withdraw");
      return { type: "NoResourcesToWithdraw" as const };
    default: {
      if (ix.type !== "Success") {
        throw new Error(ix.type);
      }
    }
  }

  await fleet.getSageGame().sendDynamicTransactions(ix.ixs, false);

  console.log("Fleet cargo unloaded!");
  await fleet.getSageGame().getQuattrinoBalance();

  return { type: "Success" as const };
};
