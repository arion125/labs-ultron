import { PublicKey } from "@solana/web3.js";
import { Fleet, ShipStats } from "@staratlas/sage";
import { SectorCoordinates } from "../../common/types";
import { SageFleetHandler } from "../../src/SageFleetHandler";
import { SageGameHandler } from "../../src/SageGameHandler";

export const canGoAndComeBack = async (
  fleetPubkey: PublicKey,
  from: SectorCoordinates,
  sectorTo: SectorCoordinates,
  starbaseTo: SectorCoordinates,
  warpToSector: boolean,
  warpToStarbase: boolean,
  gh: SageGameHandler,
  fh: SageFleetHandler
) => {
  // Get all fleet data
  const fleetAccount = await fh.getFleetAccount(fleetPubkey);
  if (fleetAccount.type !== "Success") return fleetAccount;
  const fleetStats = fleetAccount.fleet.data.stats as ShipStats;

  // Get current loaded fuel
  const fuelMint = gh.getResourceMintAddress("fuel");
  const tokenAccountsFrom = await gh.getParsedTokenAccountsByOwner(
    fleetAccount.fleet.data.fuelTank
  );
  if (tokenAccountsFrom.type !== "Success") return tokenAccountsFrom;
  const tokenAccountFrom = tokenAccountsFrom.tokenAccounts.find(
    (tokenAccount) => tokenAccount.mint.toBase58() === fuelMint.toBase58()
  );
  if (!tokenAccountFrom)
    return { type: "FleetFuelTankTokenAccountNotFound" as const };
  const currentLoadedFuel = tokenAccountFrom.amount;

  const fuelNeededForSector = calculateFuelBurnWithCoords(
    fleetStats,
    from,
    sectorTo,
    warpToSector
  );
  const fuelNeededForStarbase = calculateFuelBurnWithCoords(
    fleetStats,
    sectorTo,
    starbaseTo,
    warpToStarbase
  );

  return currentLoadedFuel >= Math.ceil(fuelNeededForSector + fuelNeededForStarbase);
};

const calculateFuelBurnWithCoords = (
  fleetStats: ShipStats,
  from: SectorCoordinates,
  to: SectorCoordinates,
  warp: boolean,
) => {
  const fuelNeeded = !warp
  ? Fleet.calculateSubwarpFuelBurnWithCoords(
    fleetStats,
    from,
    to
  )
  : Fleet.calculateWarpFuelBurnWithCoords(
    fleetStats,
    from,
    to
  );
  return fuelNeeded;
};
