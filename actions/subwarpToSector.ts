import { PublicKey } from "@solana/web3.js";
import { SectorCoordinates } from "../common/types";
import { wait } from "../utils/actions/wait";
import { calcSectorsDistanceByCoords } from "../utils/sectors/calcSectorsDistanceByCoords";
import { Sector } from "@staratlas/sage";
import { SageFleet } from "../src/SageFleet";

export const subwarpToSector = async (
  fleet: SageFleet,
  sector: Sector,
  fuelNeeded: number,
) => {
  console.log(" ");
  console.log(`Start subwarp...`);

  const sectorsDistance = fleet.getSageGame().calculateDistanceBySector(fleet.getCurrentSector(), sector);

  const timeToSubwarp = fleet.calculateSubwarpTimeWithDistance(sectorsDistance);

  let ix = await fleet.ixSubwarpToSector(sector, fuelNeeded);
  if (ix.type !== "Success") {
    throw new Error(ix.type);
  }

  await fleet.getSageGame().sendDynamicTransactions(ix.ixs, false);

  console.log(`Waiting for ${timeToSubwarp} seconds...`);
  await wait(timeToSubwarp);
  console.log(`Subwarp completed!`);
  
  await fleet.getSageGame().getQuattrinoBalance();
};
