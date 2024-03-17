import { PublicKey } from "@solana/web3.js";
import { SageFleetHandler } from "../src/SageFleetHandler";
import { SageGameHandler } from "../src/SageGameHandler";
import { wait } from "../utils/actions/wait";

export const scanSdu = async (
  fleetPubkey: PublicKey,
  gh: SageGameHandler,
  fh: SageFleetHandler,
  cooldown: number
) => {
  console.log(`Scanning sector...`);

  let ix = await fh.ixScanForSurveyDataUnits(fleetPubkey);
  
  if (ix.type !== "Success" && ix.type !== "CreateSduTokenAccount") {
    throw new Error(ix.type);
  }

  await gh.sendDynamicTransactions(ix.ixs, false);

  switch (ix.type) {
    case "CreateSduTokenAccount": {
      console.log("SDU token account created!");
      break;
    }
    case "Success": {
      console.log(`Scan completed!`);
      console.log(`Waiting Scan Cooldown for ${cooldown} seconds...`);
      await wait(cooldown);
      break;
    }
  }
  
  

  
};
