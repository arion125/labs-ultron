import {
  StarbaseInfo,
  StarbaseInfoKey,
  findStarbaseNameByCoords,
} from "../../common/starbases";
import { SectorCoordinates } from "../../common/types";
import { setResourcesAmount } from "./setResourcesAmount";
import { setStarbase } from "./setStarbase";

export const setCargoInputs = async (position: SectorCoordinates) => {
  const fleetStarbaseName = findStarbaseNameByCoords(
    position
  ) as StarbaseInfoKey;

  const starbaseDestination = await setStarbase(fleetStarbaseName, true);

  const resourcesToDestination = await setResourcesAmount(
    "Enter resources for starbase destination (e.g., Carbon 5000), or press enter to skip:"
  );
  const resourcesToStarbase = await setResourcesAmount(
    "Enter resources for current starbase (ex: Hydrogen 2000). Press enter to skip:"
  );

  return {
    starbaseTo: StarbaseInfo[starbaseDestination].coords,
    resourcesToDestination,
    resourcesToStarbase,
  };
};
