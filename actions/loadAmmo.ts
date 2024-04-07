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

  await fleet.getSageGame().sendDynamicTransactions(ix.ixs, false);

  console.log("Fleet ammo loaded!");
  await fleet.getSageGame().getQuattrinoBalance();
};
