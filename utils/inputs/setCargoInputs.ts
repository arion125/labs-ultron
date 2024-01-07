import { Resource } from "../../common/resources";
import {
  StarbaseInfo,
  StarbaseInfoKey,
  findStarbaseNameByCoords,
} from "../../common/starbases";
import { SectorCoordinates } from "../../common/types";
import { setMovementType } from "./setMovementType";
import { setResourcesAmount } from "./setResourcesAmount";
import { setStarbase } from "./setStarbase";

export const setCargoInputs = async (position: SectorCoordinates) => {
  const fleetStarbaseName = findStarbaseNameByCoords(
    position
  ) as StarbaseInfoKey;

  const starbaseDestination = await setStarbase(fleetStarbaseName, true);

  console.log(`Available resource names: ${Object.keys(Resource).join(", ")}`);

  const resourcesToDestination = await setResourcesAmount(
    "Enter resources to freight in starbase destination (e.g., Carbon 5000), or press enter to skip:"
  );
  const resourcesToStarbase = await setResourcesAmount(
    "Enter resources to freight in current starbase (ex: Hydrogen 2000). Press enter to skip:"
  );

  const movementType =
    fleetStarbaseName !== starbaseDestination ? await setMovementType() : "";

  return {
    starbaseTo: StarbaseInfo[starbaseDestination].coords,
    resourcesToDestination,
    resourcesToStarbase,
    movementType,
  };
};
