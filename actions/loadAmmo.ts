import { PublicKey } from "@solana/web3.js";
import { SageFleetHandler } from "../src/SageFleetHandler";
import { SageGameHandler } from "../src/SageGameHandler";

export const loadAmmo = async (
  fleetPubkey: PublicKey,
  ammoAmount: number,
  gh: SageGameHandler,
  fh: SageFleetHandler
) => {
  console.log(" ");
  console.log("Loading ammo to fleet...");

  let ix = await fh.ixRearmFleet(fleetPubkey, ammoAmount);
  switch (ix.type) {
    case "FleetAmmoBankIsFull":
      console.log("Your fleet ammo bank is already full");
      return;
    default:
      if (ix.type !== "Success") {
        throw new Error(ix.type);
      }
  }

  await gh.sendDynamicTransactions(ix.ixs, true);

  console.log("Fleet ammo loaded!");
  await gh.getQuattrinoBalance();
};
