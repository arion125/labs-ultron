import { PublicKey } from "@solana/web3.js";
import { SageFleetHandler } from "../src/SageFleetHandler";
import { SageGameHandler } from "../src/SageGameHandler";
import { wait } from "../utils/actions/wait";

export const scanSdu = async (
  fleetPubkey: PublicKey,
  gh: SageGameHandler,
  fh: SageFleetHandler,
  cooldown: number,
  onlyDataRunner: boolean = false
) => { 
  let ix = await fh.ixScanForSurveyDataUnits(fleetPubkey, onlyDataRunner);
  
  if (ix.type !== "Success" && ix.type !== "CreateSduTokenAccount") {
    throw new Error(ix.type);
  }
  
  switch (ix.type) {
    case "CreateSduTokenAccount": {
      console.log(`Creating SDU token account...`);
      const tx = await gh.sendDynamicTransactions(ix.ixs, false);
      if (tx.type !== "Success") {
        throw new Error(tx.type)
      }
      console.log("SDU token account created!");
      break;
    }
    case "Success": {
      console.log(`Scanning sector...`);
      const tx = await gh.sendDynamicTransactions(ix.ixs, false);
      if (tx.type !== "Success") {
        throw new Error(tx.type)
      }
      console.log(`Scan completed!`);
      console.log(`Waiting Scan Cooldown for ${cooldown} seconds...`);
      await wait(cooldown);
      break;
    }
  }
  
};
