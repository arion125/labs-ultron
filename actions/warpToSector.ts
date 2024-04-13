import { wait } from "../utils/actions/wait";
import { SageFleet } from "../src/SageFleet";
import { Sector } from "@staratlas/sage";

export const warpToSector = async (
  fleet: SageFleet,
  sector: Sector,
  fuelNeeded: number,
  waitCooldown?: boolean
) => {
  console.log(" ");
  console.log(`Start warp...`);

  const sectorsDistance = fleet.getSageGame().calculateDistanceBySector(fleet.getCurrentSector(), sector);

  const timeToWarp = fleet.calculateWarpTimeWithDistance(sectorsDistance);

  let ix = await fleet.ixWarpToSector(sector, fuelNeeded);

  if (ix.type !== "Success") {
    throw new Error(ix.type);
  }

  await fleet.getSageGame().sendDynamicTransactions(ix.ixs, false);

  console.log(`Waiting for ${timeToWarp} seconds...`);
  await wait(timeToWarp);
  console.log(`Warp completed!`);
  
  await fleet.getSageGame().getQuattrinoBalance();

  if (waitCooldown) {
    await wait(fleet.getMovementStats().warpCoolDown);
  }
};
