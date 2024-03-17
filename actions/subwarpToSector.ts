import { PublicKey } from "@solana/web3.js";
import { SectorCoordinates } from "../common/types";
import { SageFleetHandler } from "../src/SageFleetHandler";
import { SageGameHandler } from "../src/SageGameHandler";
import { wait } from "../utils/actions/wait";
import { calcSectorsDistanceByCoords } from "../utils/sectors/calcSectorsDistanceByCoords";

export const subwarpToSector = async (
  fleetPubkey: PublicKey,
  from: SectorCoordinates,
  to: SectorCoordinates,
  gh: SageGameHandler,
  fh: SageFleetHandler
) => {
  console.log(" ");
  console.log(`Start subwarp...`);

  const distanceCoords = calcSectorsDistanceByCoords(from, to);

  let ix = await fh.ixSubwarpToCoordinate(
    fleetPubkey,
    distanceCoords,
    from,
    to
  );
  if (ix.type !== "Success") {
    throw new Error(ix.type);
  }

  await gh.sendDynamicTransactions(ix.ixs, true);

  console.log(`Waiting for ${ix.timeToSubwarp} seconds...`);
  gh.getQuattrinoBalance();
  await wait(ix.timeToSubwarp);
  console.log(`Subwarp completed!`);
};
