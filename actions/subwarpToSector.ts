import { PublicKey } from "@solana/web3.js";
import { SectorCoordinates } from "../common/types";
import { wait } from "../utils/actions/wait";
import { calcSectorsDistanceByCoords } from "../utils/sectors/calcSectorsDistanceByCoords";
import { Sector } from "@staratlas/sage";
import { SageFleet } from "../src/SageFleet";

export const subwarpToSector = async (
  fleet: SageFleet,
  sector: Sector,
) => {
  console.log(" ");
  console.log(`Start subwarp...`);

  const currentSector = await fleet.getCurrentSectorAsync();
  if (currentSector.type !== "Success") return currentSector;

  const sectorsDistance = fleet.getSageGame().calculateDistanceBySector(currentSector.data, sector);
  const fuelNeeded = fleet.calculateSubwarpFuelBurnWithDistance(sectorsDistance);

  const timeToSubwarp = fleet.calculateSubwarpTimeWithDistance(sectorsDistance);

  let ix = await fleet.ixSubwarpToSector(sector, fuelNeeded);
  if (ix.type !== "Success") {
    throw new Error(ix.type);
  }

  const txs = await fleet.getSageGame().buildDynamicTransactions(ix.ixs, false);
  if (txs.type !== "Success") {
    console.log("Failed to build dynamic transactions");
    return;
  }

  await fleet.getSageGame().sendDynamicTransactions(txs.data);

  console.log(`Waiting for ${timeToSubwarp} seconds...`);
  await wait(timeToSubwarp);
  console.log(`Subwarp completed!`);
  
  await fleet.getSageGame().getQuattrinoBalance();
};
