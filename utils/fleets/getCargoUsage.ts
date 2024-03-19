import { Fleet, ShipStats } from "@staratlas/sage";
import { SageGameHandler } from "../../src/SageGameHandler";

export const getCargoUsage = async (fleet: Fleet, gh: SageGameHandler) => {
    const fleetStats = fleet.data.stats as ShipStats;
    const cargoStats = fleetStats.cargoStats;

    // Get fleet cargo hold
    const fleetCargoHoldsPubkey = fleet.data.cargoHold;
    const fleetCargoHoldsTokenAccounts =
      await gh.getParsedTokenAccountsByOwner(
        fleetCargoHoldsPubkey
      );
    if (fleetCargoHoldsTokenAccounts.type !== "Success")
      return fleetCargoHoldsTokenAccounts;
    const currentFleetCargoAmount =
      fleetCargoHoldsTokenAccounts.tokenAccounts.reduce(
        (accumulator, currentAccount) => {
          return accumulator + Number(currentAccount.amount);
        },
        0
      );
    
    return { type: "Success" as const, currentFleetCargoAmount, cargoCapacity: cargoStats.cargoCapacity};
}