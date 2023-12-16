export const Resource = {
  Food: "food",
  Fuel: "fuel",
  Ammo: "ammo",
  Tool: "tool",
  Arco: "arco",
  Biomass: "biomass",
  Carbon: "carbon",
  Diamond: "diamond",
  Hydrogen: "hydrogen",
  IronOre: "iron_ore",
  CopperOre: "copper_ore",
  Lumanite: "lumanite",
  Rochinol: "rochinol",
  Sdu: "sdu",
} as const;

export type ResourceKey = keyof typeof Resource;
export type ResourceType = (typeof Resource)[keyof typeof Resource];
