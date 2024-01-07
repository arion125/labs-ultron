import { BN } from "@project-serum/anchor";
import { Fleet, ShipStats } from "@staratlas/sage";
import { MAX_AMOUNT } from "../../common/constants";
import { SageFleetHandler } from "../../src/SageFleetHandler";
import { SageGameHandler } from "../../src/SageGameHandler";

export const getTimeAndNeededResourcesToFullCargoInMining = async (
  fleet: Fleet,
  resource: string,
  sectorCoordinates: [BN, BN],
  gh: SageGameHandler,
  fh: SageFleetHandler
) => {
  const fleetStats = fleet.data.stats as ShipStats;
  const cargoStats = fleetStats.cargoStats;

  const mint = gh.getResourceMintAddress(resource);
  const mineItemPubkey = gh.getMineItemAddress(mint);
  const mineItemAccount = await fh.getMineItemAccount(mineItemPubkey);
  if (mineItemAccount.type !== "Success") return mineItemAccount;

  const starbasePubkey = gh.getStarbaseAddress(sectorCoordinates);
  const starbaseAccount = await fh.getStarbaseAccount(starbasePubkey);
  if (starbaseAccount.type !== "Success") return starbaseAccount;

  const planetPubkey = gh.getPlanetAddress(
    starbaseAccount.starbase.data.sector as [BN, BN]
  );

  const resourcePubkey = gh.getResrouceAddress(mineItemPubkey, planetPubkey);
  const resourceAccount = await fh.getResourceAccount(resourcePubkey);
  if (resourceAccount.type !== "Success") return resourceAccount;

  const timeInSeconds = Fleet.calculateAsteroidMiningResourceExtractionDuration(
    fleetStats,
    mineItemAccount.mineItem.data,
    resourceAccount.resource.data,
    cargoStats.cargoCapacity
  );

  const food = Math.ceil(
    Fleet.calculateAsteroidMiningFoodToConsume(
      fleetStats,
      MAX_AMOUNT,
      timeInSeconds
    )
  );

  const ammo = Math.ceil(
    Fleet.calculateAsteroidMiningAmmoToConsume(
      fleetStats,
      MAX_AMOUNT,
      timeInSeconds
    )
  );

  const fuel = fleetStats.movementStats.planetExitFuelAmount;

  return { type: "Success" as const, fuel, ammo, food, timeInSeconds };
};
