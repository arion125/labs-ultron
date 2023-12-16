import { PublicKey } from "@solana/web3.js";
import { sageProvider } from "../utils/sageProvider";

export const loadAmmo = async (fleetPubkey: PublicKey, ammoAmount: number) => {
  const { sageGameHandler, sageFleetHandler } = await sageProvider();

  console.log(" ");
  console.log("Loading ammo to fleet...");

  let ix = await sageFleetHandler.ixRearmFleet(fleetPubkey, ammoAmount);
  switch (ix.type) {
    case "FleetAmmoBankIsFull":
      console.log("Your fleet ammo bank is already full");
      return;
    default:
      if (ix.type !== "Success") {
        throw new Error(ix.type);
      }
  }

  await sageGameHandler.sendDynamicTransactions(ix.ixs, true);

  /* let tx = await buildAndSignTransactionAndCheck(ix.ixs, true);
  await sendTransactionAndCheck(tx, "Fleet failed to load ammo"); */
  console.log("Fleet ammo loaded!");
  await sageGameHandler.getQuattrinoBalance();
};
