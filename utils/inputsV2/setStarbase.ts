import inquirer from "inquirer";
import { SageFleet } from "../../src/SageFleet";
import { SectorCoordinates } from "../../common/types";
import { Starbase } from "@staratlas/sage";
import { byteArrayToString } from "@staratlas/data-source";

export const setStarbaseV2 = async (
  fleet: SageFleet,
  excludeFleetCurrentStarbase: boolean = false,
) => {
  const starbases = fleet.getSageGame().getStarbases();

  const fleetCurrentSector = await fleet.getCurrentSectorAsync();
  if (fleetCurrentSector.type !== "Success")
    return fleetCurrentSector;

  const starbase = await inquirer.prompt([
    {
      type: "list",
      name: "starbase",
      message: "Choose the starbase destination:",
      choices: !excludeFleetCurrentStarbase
        ? starbases.map((starbase) => ({
            name: fleet.getSageGame().bnArraysEqual(starbase.data.sector, fleetCurrentSector.data.data.coordinates) ? 
              `${byteArrayToString(starbase.data.name)} (current starbase)` : 
              byteArrayToString(starbase.data.name),
            value: starbase,
          }))
        : starbases.filter((starbase) => !fleet.getSageGame().bnArraysEqual(starbase.data.sector, fleetCurrentSector.data.data.coordinates)).map((starbase) => ({
          name: byteArrayToString(starbase.data.name),
          value: starbase,
        }))
    },
  ]);

  return { type: "Success" as const, data: starbase.starbase as Starbase };
};
