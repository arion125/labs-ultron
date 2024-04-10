import { wait } from "../utils/actions/wait";
import { SageFleet } from "../src/SageFleet";
import { Sector } from "@staratlas/sage";

export const warpToSector = async (
  fleet: SageFleet,
  sector: Sector,
  waitCooldown?: boolean
) => {
  console.log(" ");
  console.log(`Start warp...`);

  const currentSector = await fleet.getCurrentSectorAsync();
  if (currentSector.type !== "Success") return currentSector;

  const sectorsDistance = fleet.getSageGame().calculateDistanceBySector(currentSector.data, sector);
  const fuelNeeded = fleet.calculateWarpFuelBurnWithDistance(sectorsDistance);

  const timeToWarp = fleet.calculateWarpTimeWithDistance(sectorsDistance);

  let ix = await fleet.ixWarpToSector(sector, fuelNeeded);

  if (ix.type !== "Success") {
    throw new Error(ix.type);
  }

  const txs = await fleet.getSageGame().buildDynamicTransactions(ix.ixs, false);
  if (txs.type !== "Success") {
    console.log("Failed to build dynamic transactions");
    return;
  }

  await fleet.getSageGame().sendDynamicTransactions(txs.data);

  console.log(`Waiting for ${timeToWarp} seconds...`);
  await wait(timeToWarp);
  console.log(`Warp completed!`);
  
  await fleet.getSageGame().getQuattrinoBalance();

  if (waitCooldown) {
    await wait(fleet.getMovementStats().warpCoolDown);
  }
};
