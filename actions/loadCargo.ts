import { SageFleet } from "../src/SageFleet";
import { ResourceName } from "../src/SageGame";
import { BN } from "@staratlas/anchor";

export const loadCargo = async (
  fleet: SageFleet,
  resourceName: ResourceName,
  amount: BN
) => {
  console.log(" ");
  console.log(`Loading ${amount} ${resourceName} to fleet cargo...`);

  let ix = await fleet.ixLoadCargo(resourceName, amount);

  switch (ix.type) {
    case "FleetCargoIsFull":
      console.log("Your fleet cargo is full");
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
