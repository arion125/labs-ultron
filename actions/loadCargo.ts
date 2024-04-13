import { CargoPodType, SageFleet } from "../src/SageFleet";
import { ResourceName } from "../src/SageGame";
import { BN } from "@staratlas/anchor";

export const loadCargo = async (
  fleet: SageFleet,
  resourceName: ResourceName,
  cargoPodType: CargoPodType,
  amount: BN
) => {
  console.log(" ");
  console.log(`Loading ${amount} ${resourceName} to fleet...`);

  let ix = await fleet.ixLoadCargo(resourceName, cargoPodType, amount);

  switch (ix.type) {
    case "FleetCargoPodIsFull":
      console.log("Your fleet cargo is full");
      return ix;

    case "StarbaseCargoIsEmpty":
      console.log("Starbase cargo is empty");
      return ix;
    default:
      if (ix.type !== "Success") {
        throw new Error(ix.type);
      }
  }

  await fleet.getSageGame().sendDynamicTransactions(ix.ixs, false);

  console.log("Fleet cargo loaded!");
  await fleet.getSageGame().getQuattrinoBalance();

  return { type: "Success" as const }
};
