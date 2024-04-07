import inquirer from "inquirer";
import { SageFleet } from "../../src/SageFleet";
import { SectorCoordinates } from "../../common/types";
import { Starbase } from "@staratlas/sage";

export const setStarbaseV2 = async (
  fleet: SageFleet,
  excludeFleetCurrentStarbase: boolean = false,
) => {
  const starbases = fleet.getSageGame().getStarbases();

  const fleetCurrentPosition = fleet.getCurrentSector();
  if (fleetCurrentPosition.type !== "Success")
    return fleetCurrentPosition;

  const starbase = await inquirer.prompt([
    {
      type: "list",
      name: "starbase",
      message: "Choose the starbase destination:",
      choices: !excludeFleetCurrentStarbase
        ? starbases.map((starbase) => ({
            name: starbase.data.sector as SectorCoordinates === fleetCurrentPosition.data ? `${starbase} (current starbase)` : starbase,
            value: starbase,
          }))
        : starbases.filter((starbase) => starbase.data.sector as SectorCoordinates !== fleetCurrentPosition.data)
    },
  ]);

  return { type: "Success" as const, data: starbase.starbase as Starbase };
};
