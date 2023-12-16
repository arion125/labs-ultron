import { PublicKey } from "@solana/web3.js";
import { sageProvider } from "../utils/sageProvider";

export const loadFuel = async (fleetPubkey: PublicKey, fuelAmount: number) => {
  const { sageGameHandler, sageFleetHandler } = await sageProvider();

  console.log(" ");
  console.log("Loading fuel to fleet...");

  let ix = await sageFleetHandler.ixRefuelFleet(fleetPubkey, fuelAmount);
  switch (ix.type) {
    case "FleetFuelTankIsFull":
      console.log("Your fleet fuel tank is already full");
      return;
    default:
      if (ix.type !== "Success") {
        throw new Error(ix.type);
      }
  }

  await sageGameHandler.sendDynamicTransactions(ix.ixs, true);

  /* let tx = await buildAndSignTransactionAndCheck(ix.ixs, true);
  await sendTransactionAndCheck(tx, "Fleet failed to load fuel"); */

  console.log("Fleet fuel loaded!");
  await sageGameHandler.getQuattrinoBalance();
};
