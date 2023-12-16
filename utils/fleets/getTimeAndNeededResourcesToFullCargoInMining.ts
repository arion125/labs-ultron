import { BN } from "@project-serum/anchor";
import { Fleet, ShipStats } from "@staratlas/sage";
import { MAX_AMOUNT } from "../../common/constants";
import { sageProvider } from "../sageProvider";

export const getTimeAndNeededResourcesToFullCargoInMining = async (
  fleet: Fleet,
  resource: string,
  sectorCoordinates: [BN, BN]
) => {
  const { sageGameHandler, sageFleetHandler } = await sageProvider();

  const fleetStats = fleet.data.stats as ShipStats;
  const cargoStats = fleetStats.cargoStats;

  const mint = sageGameHandler.getResourceMintAddress(resource);
  const mineItemPubkey = sageGameHandler.getMineItemAddress(mint);
  const mineItemAccount = await sageFleetHandler.getMineItemAccount(
    mineItemPubkey
  );
  if (mineItemAccount.type !== "Success") return mineItemAccount;

  const starbasePubkey = sageGameHandler.getStarbaseAddress(sectorCoordinates);
  const starbaseAccount = await sageFleetHandler.getStarbaseAccount(
    starbasePubkey
  );
  if (starbaseAccount.type !== "Success") return starbaseAccount;

  const planetPubkey = await sageGameHandler.getPlanetAddress(
    starbaseAccount.starbase.data.sector as [BN, BN]
  );

  const resourcePubkey = sageGameHandler.getResrouceAddress(
    mineItemPubkey,
    planetPubkey
  );
  const resourceAccount = await sageFleetHandler.getResourceAccount(
    resourcePubkey
  );
  if (resourceAccount.type !== "Success") return resourceAccount;

  const timeInSeconds = Fleet.calculateAsteroidMiningResourceExtractionDuration(
    fleetStats,
    mineItemAccount.mineItem.data,
    resourceAccount.resource.data,
    cargoStats.cargoCapacity
  );

  const food = Fleet.calculateAsteroidMiningFoodToConsume(
    fleetStats,
    MAX_AMOUNT,
    timeInSeconds
  );

  const ammo = Fleet.calculateAsteroidMiningAmmoToConsume(
    fleetStats,
    MAX_AMOUNT,
    timeInSeconds
  );

  const fuel = fleetStats.movementStats.planetExitFuelAmount;

  return { type: "Success" as const, fuel, ammo, food, timeInSeconds };
};
