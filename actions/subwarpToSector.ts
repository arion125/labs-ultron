import { PublicKey } from "@solana/web3.js";
import { SectorCoordinates } from "../common/types";
import { wait } from "../utils/actions/wait";
import { sageProvider } from "../utils/sageProvider";

export const subwarpToSector = async (
  fleetPubkey: PublicKey,
  distanceCoords: SectorCoordinates
) => {
  const { sageGameHandler, sageFleetHandler } = await sageProvider();

  console.log(" ");
  console.log(`Start subwarp...`);

  let ix = await sageFleetHandler.ixSubwarpToCoordinate(
    fleetPubkey,
    distanceCoords
  );
  if (ix.type !== "Success") {
    throw new Error(ix.type);
  }

  await sageGameHandler.sendDynamicTransactions(ix.ixs, true);

  /* let tx = await buildAndSignTransactionAndCheck(ix.ixs, true);
  await sendTransactionAndCheck(tx, "Fleet failed to subwarp"); */
  console.log(`Waiting for ${ix.timeToSubwarp} seconds...`);
  await sageGameHandler.getQuattrinoBalance();
  await wait(ix.timeToSubwarp);
  console.log(`Subwarp completed!`);
};
