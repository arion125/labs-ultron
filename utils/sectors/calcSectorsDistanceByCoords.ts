import { SectorCoordinates } from "../../common/types";
export const calcSectorsDistanceByCoords = (
  sectorFrom: SectorCoordinates,
  sectorTo: SectorCoordinates
): SectorCoordinates => {
  const distanceX = sectorTo[0].sub(sectorFrom[0]);
  const distanceY = sectorTo[1].sub(sectorFrom[1]);

  return [distanceX, distanceY];
};
