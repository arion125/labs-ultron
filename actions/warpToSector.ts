import { PublicKey } from "@solana/web3.js";
import { SectorCoordinates } from "../common/types";
import { SageFleetHandler } from "../src/SageFleetHandler";
import { SageGameHandler } from "../src/SageGameHandler";
import { wait } from "../utils/actions/wait";
import { calcSectorsDistanceByCoords } from "../utils/sectors/calcSectorsDistanceByCoords";

export const warpToSector = async (
  fleetPubkey: PublicKey,
  from: SectorCoordinates,
  to: SectorCoordinates,
  gh: SageGameHandler,
  fh: SageFleetHandler,
  waitCooldown?: boolean
) => {
  console.log(" ");
  console.log(`Start warp...`);

  const distanceCoords = calcSectorsDistanceByCoords(from, to);

  let ix = await fh.ixWarpToCoordinate(fleetPubkey, distanceCoords, from, to);
  if (ix.type !== "Success") {
    throw new Error(ix.type);
  }

  await gh.sendDynamicTransactions(ix.ixs, true);

  console.log(`Waiting for ${ix.timeToWarp} seconds...`);
  await gh.getQuattrinoBalance();
  await wait(ix.timeToWarp);
  console.log(`Warp completed!`);

  if (waitCooldown) {
    await wait(ix.warpCooldown);
  }
};
