import { SageFleet } from "../src/SageFleet";
import { BN } from "@staratlas/anchor";

export const loadAmmo = async (
  fleet: SageFleet,
  amount: BN
) => {
  console.log(" ");
  console.log("Loading ammo to fleet...");

  let ix = await fleet.ixLoadAmmoBank(amount);

  switch (ix.type) {
    case "FleetAmmoBankIsFull":
      console.log("Your fleet ammo bank is already full");
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

  console.log("Fleet ammo loaded!");
  await fleet.getSageGame().getQuattrinoBalance();
};
