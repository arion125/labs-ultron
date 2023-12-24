import { PublicKey } from "@solana/web3.js";
import { SectorCoordinates } from "../common/types";
import { SageFleetHandler } from "../src/SageFleetHandler";
import { SageGameHandler } from "../src/SageGameHandler";
import { wait } from "../utils/actions/wait";

export const subwarpToSector = async (
  fleetPubkey: PublicKey,
  distanceCoords: SectorCoordinates,
  gh: SageGameHandler,
  fh: SageFleetHandler
) => {
  console.log(" ");
  console.log(`Start subwarp...`);

  let ix = await fh.ixSubwarpToCoordinate(fleetPubkey, distanceCoords);
  if (ix.type !== "Success") {
    throw new Error(ix.type);
  }

  await gh.sendDynamicTransactions(ix.ixs, true);

  console.log(`Waiting for ${ix.timeToSubwarp} seconds...`);
  await gh.getQuattrinoBalance();
  await wait(ix.timeToSubwarp);
  console.log(`Subwarp completed!`);
};
