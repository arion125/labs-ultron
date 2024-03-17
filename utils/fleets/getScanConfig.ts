import { Fleet, ShipStats } from "@staratlas/sage";
import { SectorCoordinates } from "../../common/types";
import { BN } from "@project-serum/anchor";

const sduLoopSequence = [
  { x: 0, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 1 },
  { x: -1, y: 0 },
  { x: -1, y: -1 },
  { x: 0, y: -1 },
  { x: 1, y: -1 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
]

export const getScanConfig = async (
  fleet: Fleet,
/*   sectorTo: SectorCoordinates | undefined,
  searchBehavior: string, */
) => {
  const fleetStats = fleet.data.stats as ShipStats;
  const cargoStats = fleetStats.cargoStats;
  const miscStats = fleetStats.miscStats;

  const maxScanAvailable = Math.trunc(cargoStats.cargoCapacity / miscStats.scanRepairKitAmount);
  const scanCoolDown = miscStats.scanCoolDown;

  const fuelCapacity = (fleet.data.stats as ShipStats).cargoStats.fuelCapacity;

  /* const sduLoop = [];
  if (searchBehavior !== "autopilot" && sectorTo) {
    for (let i = 0; i < maxScanAvailable; i++) {
      let loopSector = sectorTo;
      if (searchBehavior == "loop") {
        const sequenceElement = sduLoopSequence[i % sduLoopSequence.length];
        loopSector = [
          new BN(sequenceElement.x).add(sectorTo[0]),
          new BN(sequenceElement.y).add(sectorTo[1])
        ] as SectorCoordinates;
      }
      sduLoop.push(loopSector);
    }
  } */

  return { type: "Success" as const, maxScanAvailable, scanCoolDown, fuelCapacity, /* sduLoop */ };
};
