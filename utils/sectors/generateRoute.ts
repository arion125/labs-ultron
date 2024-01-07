import { BN } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { Fleet, ShipStats, calculateDistance } from "@staratlas/sage";
import { RouteStep, SectorCoordinates } from "../../common/types";
import { SageFleetHandler } from "../../src/SageFleetHandler";
import { SageGameHandler } from "../../src/SageGameHandler";

export const generateRoute = async (
  fleetPubkey: PublicKey,
  from: SectorCoordinates,
  to: SectorCoordinates,
  warp: boolean,
  gh: SageGameHandler,
  fh: SageFleetHandler
) => {
  // Get all fleet data
  const fleetAccount = await fh.getFleetAccount(fleetPubkey);
  if (fleetAccount.type !== "Success") return fleetAccount;
  const fleetStats = fleetAccount.fleet.data.stats as ShipStats;
  const fleetMaxWarpDistance = fleetStats.movementStats.maxWarpDistance / 100;

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

  let route: RouteStep[] = [];

  // Only subwarp
  if (!warp) {
    if (!canSubwarp(fleetStats, from, to, currentLoadedFuel))
      return { type: "NotEnoughFuelToSubwarp" as const };
    route.push({
      from,
      to,
      warp: false,
    });
    return { type: "Success" as const, result: route };
  }

  // Warp - and Subwarp if necessary
  route = calculateOptimalRoute(from, to, fleetMaxWarpDistance);

  const checkRoute = checkRoundTrip(route, fleetStats, currentLoadedFuel);
  if (checkRoute.type !== "Success") return checkRoute;

  route = checkRoute.result.route;

  return { type: "Success" as const, result: route };
};

// Calculates if warp is possible with available fuel
const canWarp = (
  fleetStats: ShipStats,
  from: SectorCoordinates,
  to: SectorCoordinates,
  currentLoadedFuel: bigint
): boolean => {
  const fuelNeededForWarp = Fleet.calculateWarpFuelBurnWithCoords(
    fleetStats,
    from,
    to
  );
  return currentLoadedFuel >= fuelNeededForWarp;
};

// Attempts to add a subwarp route if fuel permits
const canSubwarp = (
  fleetStats: ShipStats,
  from: SectorCoordinates,
  to: SectorCoordinates,
  currentLoadedFuel: bigint
) => {
  const fuelNeeded = Fleet.calculateSubwarpFuelBurnWithCoords(
    fleetStats,
    from,
    to
  );
  return fuelNeeded <= currentLoadedFuel;
};

const calculateOptimalRoute = (
  start: SectorCoordinates,
  end: SectorCoordinates,
  maxWarp: number
): RouteStep[] => {
  const route: RouteStep[] = [];
  let current = start;
  let prevDistance = calculateDistance(start, end);

  while (!current[0].eq(end[0]) || !current[1].eq(end[1])) {
    let nextStep: SectorCoordinates = [new BN(0), new BN(0)];
    let closestDistance = prevDistance;

    for (let dx = -maxWarp; dx <= maxWarp; dx++) {
      for (let dy = -maxWarp; dy <= maxWarp; dy++) {
        let trialStep: SectorCoordinates = [
          current[0].add(new BN(dx)),
          current[1].add(new BN(dy)),
        ];

        let stepDistance = calculateDistance(trialStep, end);

        if (
          calculateDistance(current, trialStep) <= maxWarp &&
          stepDistance < closestDistance
        ) {
          nextStep = trialStep;
          closestDistance = stepDistance;
        }
      }
    }

    /* if (calculateDistance(current, nextStep) <= 1) {
      route.push({ from: current, to: end, warp: false });
      break;
    } */

    if (
      nextStep &&
      (!nextStep[0].eq(current[0]) || !nextStep[1].eq(current[1]))
    ) {
      route.push({ from: current, to: nextStep, warp: true });
      current = nextStep;
      prevDistance = closestDistance;
    } else {
      break;
    }
  }

  return route;
};

const checkRouteFeasibility = (
  route: RouteStep[],
  fleetStats: ShipStats,
  currentLoadedFuel: bigint
) => {
  let remainingFuel = currentLoadedFuel;

  for (let i = 0; i < route.length; i++) {
    const step = route[i];
    if (step.warp) {
      if (!canWarp(fleetStats, step.from, step.to, remainingFuel)) {
        break;
      } else {
        remainingFuel -= BigInt(
          Math.ceil(
            Fleet.calculateWarpFuelBurnWithCoords(
              fleetStats,
              step.from,
              step.to
            )
          )
        );
      }
    } else {
      if (!canSubwarp(fleetStats, step.from, step.to, remainingFuel)) {
        break;
      } else {
        remainingFuel -= BigInt(
          Math.ceil(
            Fleet.calculateSubwarpFuelBurnWithCoords(
              fleetStats,
              step.from,
              step.to
            )
          )
        );
      }
    }

    if (i === route.length - 1) {
      return {
        type: "Success" as const,
        result: {
          route,
          fuelNeeded: currentLoadedFuel - remainingFuel,
        },
      };
    }
  }

  const totalFuelNeededForSubwarp = BigInt(
    Math.ceil(
      Fleet.calculateSubwarpFuelBurnWithCoords(
        fleetStats,
        route[0].from, // starting point
        route[route.length - 1].to // final destination
      )
    )
  );

  if (totalFuelNeededForSubwarp <= currentLoadedFuel) {
    const modifiedRoute: RouteStep[] = [
      { from: route[0].from, to: route[route.length - 1].to, warp: false },
    ];
    return {
      type: "Success" as const,
      result: {
        route: modifiedRoute,
        fuelNeeded: totalFuelNeededForSubwarp,
      },
    };
  } else {
    return { type: "RouteNotFeasible" as const };
  }
};

const checkRoundTrip = (
  route: RouteStep[],
  fleetStats: ShipStats,
  currentLoadedFuel: bigint
) => {
  const oneWayRoute = checkRouteFeasibility(
    route,
    fleetStats,
    currentLoadedFuel
  );
  if (oneWayRoute.type !== "Success") return oneWayRoute;

  const returnRoute = oneWayRoute.result.route
    .map((step) => {
      return { ...step, from: step.to, to: step.from };
    })
    .reverse();

  const roundTripRoute = checkRouteFeasibility(
    returnRoute,
    fleetStats,
    currentLoadedFuel - oneWayRoute.result.fuelNeeded
  );
  if (roundTripRoute.type !== "Success") return roundTripRoute;

  return { type: "Success" as const, result: oneWayRoute.result };
};
