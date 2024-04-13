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
      case "NoEnoughFood":
        console.log("No enough food to scan");
        return ix;
  
      case "FleetCargoIsFull":
        console.log("Your fleet cargo is full");
        return ix;
      default:
        if (ix.type !== "Success") {
          throw new Error(ix.type);
        }
    }
    
    const sdt = await fleet.getSageGame().sendDynamicTransactions(ix.ixs, true);
    if (sdt.type !== "Success") return sdt;

    console.log(`\nScan completed!`);
    console.log(`\nWaiting Scan Cooldown for ${fleet.getStats().miscStats.scanCoolDown} seconds...`);
    await wait(fleet.getStats().miscStats.scanCoolDown);

    return { type: "Success" as const }

  } catch (e) {
    throw e;
  }
  
};