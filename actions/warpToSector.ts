import { PublicKey } from "@solana/web3.js";
import { SectorCoordinates } from "../common/types";
import { wait } from "../utils/actions/wait";
import { sageProvider } from "../utils/sageProvider";

// TODO: Need refactoring - WIP
export const warpToSector = async (
  fleetPubkey: PublicKey,
  distanceCoords: SectorCoordinates,
  waitCooldown?: boolean
) => {
  const { sageGameHandler, sageFleetHandler } = await sageProvider();

  console.log(" ");
  console.log(`Start warp...`);

  let ix = await sageFleetHandler.ixWarpToCoordinate(
    fleetPubkey,
    distanceCoords
  );
  if (ix.type !== "Success") {
    throw new Error(ix.type);
  }

  await sageGameHandler.sendDynamicTransactions(ix.ixs, true);

  console.log(`Waiting for ${ix.timeToWarp} seconds...`);
  await sageGameHandler.getQuattrinoBalance();
  await wait(ix.timeToWarp);
  console.log(`Warp completed!`);

  if (waitCooldown) {
    await wait(ix.warpCooldown);
  }
};
