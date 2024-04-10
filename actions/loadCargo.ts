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
      return;

    case "StarbaseCargoIsEmpty":
      console.log("Starbase cargo is empty");
      return;
    default:
      if (ix.type !== "Success") {
        throw new Error(ix.type);
      }
  }

  const txs = await fleet.getSageGame().buildDynamicTransactions(ix.ixs, false);
  if (txs.type !== "Success") {
    console.log("Failed to build dynamic transactions");
    return;
  }

  await fleet.getSageGame().sendDynamicTransactions(txs.data);

  console.log("Fleet cargo loaded!");
  await fleet.getSageGame().getQuattrinoBalance();
};
