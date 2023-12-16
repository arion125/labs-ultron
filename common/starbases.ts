import { BN } from "@project-serum/anchor";
import { Resource } from "./resources";
import { SectorCoordinates } from "./types";

export const StarbaseInfo = {
  MUD: {
    coords: [new BN(0), new BN(-39)] as SectorCoordinates,
    resourcesToMine: [Resource.Hydrogen],
    richness: 1,
  },
  MUD2: {
    coords: [new BN(2), new BN(-34)] as SectorCoordinates,
    resourcesToMine: [Resource.IronOre],
    richness: 1,
  },
  MUD3: {
    coords: [new BN(10), new BN(-41)] as SectorCoordinates,
    resourcesToMine: [Resource.Carbon],
    richness: 1,
  },
  MUD4: {
    coords: [new BN(-2), new BN(-44)] as SectorCoordinates,
    resourcesToMine: [Resource.Biomass],
    richness: 1,
  },
  MUD5: {
    coords: [new BN(-10), new BN(-37)] as SectorCoordinates,
    resourcesToMine: [Resource.CopperOre],
    richness: 1,
  },
  MRZ1: {
    coords: [new BN(-15), new BN(-33)] as SectorCoordinates,
    resourcesToMine: [Resource.CopperOre, Resource.IronOre],
    richness: 1.5,
  },
  MRZ2: {
    coords: [new BN(12), new BN(-31)] as SectorCoordinates,
    resourcesToMine: [Resource.Lumanite],
    richness: 1,
  },
  MRZ3: {
    coords: [new BN(-22), new BN(-25)] as SectorCoordinates,
    resourcesToMine: [Resource.Biomass, Resource.IronOre],
    richness: 1.5,
  },
  MRZ4: {
    coords: [new BN(-8), new BN(-24)] as SectorCoordinates,
    resourcesToMine: [Resource.Hydrogen, Resource.CopperOre],
    richness: 1.5,
  },
  MRZ5: {
    coords: [new BN(2), new BN(-23)] as SectorCoordinates,
    resourcesToMine: [Resource.Hydrogen, Resource.Carbon],
    richness: 1.5,
  },
  MRZ6: {
    coords: [new BN(11), new BN(-16)] as SectorCoordinates,
    resourcesToMine: [Resource.Hydrogen],
    richness: 2,
  },
  MRZ7: {
    coords: [new BN(21), new BN(-26)] as SectorCoordinates,
    resourcesToMine: [Resource.Carbon, Resource.CopperOre],
    richness: 1.5,
  },
  MRZ8: {
    coords: [new BN(-30), new BN(-16)] as SectorCoordinates,
    resourcesToMine: [Resource.IronOre],
    richness: 2,
  },
  MRZ9: {
    coords: [new BN(-14), new BN(-16)] as SectorCoordinates,
    resourcesToMine: [Resource.Carbon, Resource.Biomass],
    richness: 1.5,
  },
  MRZ10: {
    coords: [new BN(23), new BN(-12)] as SectorCoordinates,
    resourcesToMine: [Resource.Lumanite],
    richness: 1.5,
  },
  MRZ11: {
    coords: [new BN(31), new BN(-19)] as SectorCoordinates,
    resourcesToMine: [Resource.Carbon],
    richness: 2,
  },
  MRZ12: {
    coords: [new BN(-16), new BN(0)] as SectorCoordinates,
    resourcesToMine: [Resource.Diamond],
    richness: 1,
  },
  ONI: {
    coords: [new BN(-40), new BN(30)] as SectorCoordinates,
    resourcesToMine: [Resource.Hydrogen],
    richness: 1,
  },
  ONI2: {
    coords: [new BN(-42), new BN(35)] as SectorCoordinates,
    resourcesToMine: [Resource.Biomass],
    richness: 1,
  },
  ONI3: {
    coords: [new BN(-30), new BN(30)] as SectorCoordinates,
    resourcesToMine: [Resource.Carbon],
    richness: 1,
  },
  ONI4: {
    coords: [new BN(-38), new BN(25)] as SectorCoordinates,
    resourcesToMine: [Resource.IronOre],
    richness: 1,
  },
  ONI5: {
    coords: [new BN(-47), new BN(30)] as SectorCoordinates,
    resourcesToMine: [Resource.CopperOre],
    richness: 1,
  },
  MRZ13: {
    coords: [new BN(-36), new BN(-7)] as SectorCoordinates,
    resourcesToMine: [Resource.Carbon],
    richness: 2,
  },
  MRZ14: {
    coords: [new BN(-23), new BN(4)] as SectorCoordinates,
    resourcesToMine: [Resource.Lumanite],
    richness: 1.5,
  },
  MRZ18: {
    coords: [new BN(-40), new BN(3)] as SectorCoordinates,
    resourcesToMine: [Resource.Biomass, Resource.Carbon],
    richness: 1.5,
  },
  MRZ19: {
    coords: [new BN(-35), new BN(12)] as SectorCoordinates,
    resourcesToMine: [Resource.Carbon, Resource.CopperOre],
    richness: 1.5,
  },
  MRZ20: {
    coords: [new BN(-25), new BN(15)] as SectorCoordinates,
    resourcesToMine: [Resource.Hydrogen, Resource.Carbon],
    richness: 1.5,
  },
  MRZ24: {
    coords: [new BN(-45), new BN(15)] as SectorCoordinates,
    resourcesToMine: [Resource.IronOre, Resource.CopperOre],
    richness: 1.5,
  },
  MRZ25: {
    coords: [new BN(-18), new BN(23)] as SectorCoordinates,
    resourcesToMine: [Resource.Hydrogen],
    richness: 2,
  },
  MRZ26: {
    coords: [new BN(-9), new BN(24)] as SectorCoordinates,
    resourcesToMine: [Resource.Hydrogen, Resource.CopperOre],
    richness: 1.5,
  },
  MRZ29: {
    coords: [new BN(-22), new BN(32)] as SectorCoordinates,
    resourcesToMine: [Resource.Lumanite],
    richness: 1,
  },
  MRZ30: {
    coords: [new BN(-19), new BN(40)] as SectorCoordinates,
    resourcesToMine: [Resource.Biomass, Resource.IronOre],
    richness: 1.5,
  },
  MRZ31: {
    coords: [new BN(-8), new BN(35)] as SectorCoordinates,
    resourcesToMine: [Resource.IronOre],
    richness: 2,
  },
  MRZ36: {
    coords: [new BN(0), new BN(16)] as SectorCoordinates,
    resourcesToMine: [Resource.Rochinol],
    richness: 2,
  },
  Ustur: {
    coords: [new BN(40), new BN(30)] as SectorCoordinates,
    resourcesToMine: [Resource.Hydrogen],
    richness: 1,
  },
  UST2: {
    coords: [new BN(42), new BN(35)] as SectorCoordinates,
    resourcesToMine: [Resource.Biomass],
    richness: 1,
  },
  UST3: {
    coords: [new BN(48), new BN(32)] as SectorCoordinates,
    resourcesToMine: [Resource.Carbon],
    richness: 1,
  },
  UST4: {
    coords: [new BN(38), new BN(25)] as SectorCoordinates,
    resourcesToMine: [Resource.IronOre],
    richness: 1,
  },
  UST5: {
    coords: [new BN(30), new BN(28)] as SectorCoordinates,
    resourcesToMine: [Resource.CopperOre],
    richness: 1,
  },
  MRZ15: {
    coords: [new BN(22), new BN(5)] as SectorCoordinates,
    resourcesToMine: [Resource.Hydrogen, Resource.CopperOre],
    richness: 1.5,
  },
  MRZ16: {
    coords: [new BN(39), new BN(-1)] as SectorCoordinates,
    resourcesToMine: [Resource.IronOre],
    richness: 2,
  },
  MRZ17: {
    coords: [new BN(16), new BN(-5)] as SectorCoordinates,
    resourcesToMine: [Resource.Arco],
    richness: 1,
  },
  MRZ21: {
    coords: [new BN(25), new BN(14)] as SectorCoordinates,
    resourcesToMine: [Resource.Hydrogen],
    richness: 2,
  },
  MRZ22: {
    coords: [new BN(35), new BN(16)] as SectorCoordinates,
    resourcesToMine: [Resource.Lumanite],
    richness: 1,
  },
  MRZ23: {
    coords: [new BN(44), new BN(10)] as SectorCoordinates,
    resourcesToMine: [Resource.Biomass, Resource.IronOre],
    richness: 1.5,
  },
  MRZ27: {
    coords: [new BN(2), new BN(26)] as SectorCoordinates,
    resourcesToMine: [Resource.Lumanite],
    richness: 1.5,
  },
  MRZ28: {
    coords: [new BN(17), new BN(21)] as SectorCoordinates,
    resourcesToMine: [Resource.Hydrogen, Resource.Carbon],
    richness: 1.5,
  },
  MRZ32: {
    coords: [new BN(5), new BN(44)] as SectorCoordinates,
    resourcesToMine: [Resource.Carbon],
    richness: 2,
  },
  MRZ33: {
    coords: [new BN(13), new BN(37)] as SectorCoordinates,
    resourcesToMine: [Resource.Biomass, Resource.Carbon],
    richness: 1.5,
  },
  MRZ34: {
    coords: [new BN(22), new BN(31)] as SectorCoordinates,
    resourcesToMine: [Resource.CopperOre, Resource.Carbon],
    richness: 1.5,
  },
  MRZ35: {
    coords: [new BN(49), new BN(20)] as SectorCoordinates,
    resourcesToMine: [Resource.IronOre, Resource.CopperOre],
    richness: 1.5,
  },
};

export type StarbaseInfoKey = keyof typeof StarbaseInfo;
export type StarbaseInfoType = (typeof StarbaseInfo)[keyof typeof StarbaseInfo];

/* export const StarbaseCoords = {
  MUD: [new BN(0), new BN(-39)] as [BN, BN],
  MUD2: [new BN(2), new BN(-34)] as [BN, BN],
  MUD3: [new BN(10), new BN(-41)] as [BN, BN],
  MUD4: [new BN(-2), new BN(-44)] as [BN, BN],
  MUD5: [new BN(-10), new BN(-37)] as [BN, BN],
  MRZ1: [new BN(-15), new BN(-33)] as [BN, BN],
  MRZ2: [new BN(12), new BN(-31)] as [BN, BN],
  MRZ3: [new BN(-22), new BN(-25)] as [BN, BN],
  MRZ4: [new BN(-8), new BN(-24)] as [BN, BN],
  MRZ5: [new BN(2), new BN(-23)] as [BN, BN],
  MRZ6: [new BN(11), new BN(-16)] as [BN, BN],
  MRZ7: [new BN(21), new BN(-26)] as [BN, BN],
  MRZ8: [new BN(-30), new BN(-16)] as [BN, BN],
  MRZ9: [new BN(-14), new BN(-16)] as [BN, BN],
  MRZ10: [new BN(23), new BN(-12)] as [BN, BN],
  MRZ11: [new BN(31), new BN(-19)] as [BN, BN],
  MRZ12: [new BN(-16), new BN(0)] as [BN, BN],
  ONI: [new BN(-40), new BN(30)] as [BN, BN],
  ONI2: [new BN(-42), new BN(35)] as [BN, BN],
  ONI3: [new BN(-30), new BN(30)] as [BN, BN],
  ONI4: [new BN(-38), new BN(25)] as [BN, BN],
  ONI5: [new BN(-47), new BN(30)] as [BN, BN],
  MRZ13: [new BN(-36), new BN(-7)] as [BN, BN],
  MRZ14: [new BN(-23), new BN(4)] as [BN, BN],
  MRZ18: [new BN(-40), new BN(3)] as [BN, BN],
  MRZ19: [new BN(-35), new BN(12)] as [BN, BN],
  MRZ20: [new BN(-25), new BN(15)] as [BN, BN],
  MRZ24: [new BN(-45), new BN(15)] as [BN, BN],
  MRZ25: [new BN(-18), new BN(23)] as [BN, BN],
  MRZ26: [new BN(-9), new BN(24)] as [BN, BN],
  MRZ29: [new BN(-22), new BN(32)] as [BN, BN],
  MRZ30: [new BN(-19), new BN(40)] as [BN, BN],
  MRZ31: [new BN(-8), new BN(35)] as [BN, BN],
  MRZ36: [new BN(0), new BN(16)] as [BN, BN],
  Ustur: [new BN(40), new BN(30)] as [BN, BN],
  UST2: [new BN(42), new BN(35)] as [BN, BN],
  UST3: [new BN(48), new BN(32)] as [BN, BN],
  UST4: [new BN(38), new BN(25)] as [BN, BN],
  UST5: [new BN(30), new BN(28)] as [BN, BN],
  MRZ15: [new BN(22), new BN(5)] as [BN, BN],
  MRZ16: [new BN(39), new BN(-1)] as [BN, BN],
  MRZ17: [new BN(16), new BN(-5)] as [BN, BN],
  MRZ21: [new BN(25), new BN(14)] as [BN, BN],
  MRZ22: [new BN(35), new BN(16)] as [BN, BN],
  MRZ23: [new BN(44), new BN(10)] as [BN, BN],
  MRZ27: [new BN(2), new BN(26)] as [BN, BN],
  MRZ28: [new BN(17), new BN(21)] as [BN, BN],
  MRZ32: [new BN(5), new BN(44)] as [BN, BN],
  MRZ33: [new BN(13), new BN(37)] as [BN, BN],
  MRZ34: [new BN(22), new BN(31)] as [BN, BN],
  MRZ35: [new BN(49), new BN(20)] as [BN, BN],
} as const;

export type StarbaseCoordsKey = keyof typeof StarbaseCoords;
export type StarbaseCoordsType =
  (typeof StarbaseCoords)[keyof typeof StarbaseCoords]; */

export const findStarbaseNameByCoords = (coords: SectorCoordinates) => {
  for (const [key, starbase] of Object.entries(StarbaseInfo)) {
    if (starbase.coords[0].eq(coords[0]) && starbase.coords[1].eq(coords[1])) {
      return key as StarbaseInfoKey;
    }
  }
  return;
};
