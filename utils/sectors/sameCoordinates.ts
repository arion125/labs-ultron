import { SectorCoordinates } from "../../common/types";

export const sameCoordinates = (
  sectorCoordinates1: SectorCoordinates,
  sectorCoordinates2: SectorCoordinates,
) => {
  return sectorCoordinates1[0].eq(sectorCoordinates2[0]) && sectorCoordinates1[1].eq(sectorCoordinates2[1]);
};
