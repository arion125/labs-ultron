import {
  StarbaseInfo,
  StarbaseInfoKey,
  findStarbaseNameByCoords,
} from "../../common/starbases";
import { SectorCoordinates } from "../../common/types";
import { setMovementType } from "./setMovementType";
import { setStarbaseAndResource } from "./setStarbaseAndResource";

export const setMiningInputs = async (position: SectorCoordinates) => {
  const fleetStarbaseName = findStarbaseNameByCoords(
    position
  ) as StarbaseInfoKey;

  const { starbase, resourceToMine } = await setStarbaseAndResource(
    fleetStarbaseName
  );

  const movementType =
    fleetStarbaseName !== starbase ? await setMovementType() : "";

  return fleetStarbaseName === starbase
    ? {
        resourceToMine,
      }
    : {
        starbase: StarbaseInfo[starbase].coords,
        movementType,
        resourceToMine,
      };
};
