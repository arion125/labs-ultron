import { BN } from "@project-serum/anchor";
import { Fleet } from "@staratlas/sage";
import { SectorCoordinates } from "../../common/types";
import { getStarbaseDataByPubkey } from "../starbases/getStarbaseDataByPubkey";

export const getFleetPosition = async (fleet: Fleet) => {
  let coordinates;

  if (fleet.state.MoveSubwarp) {
    coordinates = fleet.state.MoveSubwarp.currentSector as SectorCoordinates;
    return {
      type: "Success" as const,
      position: coordinates,
    };
  }

  if (fleet.state.StarbaseLoadingBay) {
    const starbase = await getStarbaseDataByPubkey(
      fleet.state.StarbaseLoadingBay.starbase
    );
    if (starbase.type !== "Success")
      return { type: "FleetPositionNotFound" as const };
    coordinates = starbase.starbase.data.sector as SectorCoordinates;
    coordinates = [
      new BN(parseInt(coordinates[0], 10)),
      new BN(parseInt(coordinates[1], 10)),
    ] as SectorCoordinates;

    return {
      type: "Success" as const,
      position: coordinates,
    };
  }

  if (fleet.state.Idle) {
    coordinates = fleet.state.Idle.sector as SectorCoordinates;
    return {
      type: "Success" as const,
      position: coordinates,
    };
  }

  if (fleet.state.Respawn) {
    coordinates = fleet.state.Respawn.sector as SectorCoordinates;
    return {
      type: "Success" as const,
      position: coordinates,
    };
  }

  return { type: "FleetPositionNotFound" as const };
};
