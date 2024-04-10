import { wait } from "../utils/actions/wait";
import { SageFleet } from "../src/SageFleet";

export const scanSdu = async (
  fleet: SageFleet,
  counter?: number
) => {
  try {
    console.log(" ");
    console.log(`${counter}. Scanning sector...`);

    let ix = await fleet.ixScanForSurveyDataUnits();

    switch (ix.type) {
      case "NoEnoughRepairKits":
        console.log("No enough repair kits");
        return ix;
  
      case "FleetCargoIsFull":
        console.log("Your fleet cargo is full");
        return ix;
      default:
        if (ix.type !== "Success") {
          throw new Error(ix.type);
        }
    }
    
    const txs = await fleet.getSageGame().buildDynamicTransactions(ix.ixs, false);
    if (txs.type !== "Success") {
        console.log("Failed to build dynamic transactions");
        return { type: "FailedToBuildDynamicTransactions" as const };
    }

    // TODO: handle partial success of dynamic transactions
    await fleet.getSageGame().sendDynamicTransactions(txs.data);

    console.log(`Scan completed!`);
    console.log(`Waiting Scan Cooldown for ${fleet.getStats().miscStats.scanCoolDown} seconds...`);
    await wait(fleet.getStats().miscStats.scanCoolDown);

    return { type: "Success" as const }

  } catch (e) {
    throw e;
  }
  
};