import inquirer from "inquirer";
import { MineItem, Resource, Sector } from "@staratlas/sage";
import { SageFleet } from "../../src/SageFleet";

type MinableResource = {
    resource: Resource;
    mineItem: MineItem;
}

export const setResourceToMine = async (
    fleet: SageFleet,
    sector: Sector
  ) => {
    const planet = fleet.getSageGame().getPlanetBySector(sector);
    if (planet.type !== "Success") return planet;

    const resources = await fleet.getSageGame().findResourcesByPlanetAsync(planet.data);
    if (resources.type !== "Success") return resources;

    const minableResources: MinableResource[] = [];

    for (const resource of resources.data) {
        const mineItem = fleet.getSageGame().getMineItemByPublicKey(resource.data.mineItem);
        
        if (mineItem.type !== "Success") {
            minableResources.length = 0;
            break;
        }

        minableResources.push({
            resource,
            mineItem: mineItem.data
        });
    }

    if (minableResources.length === 0) {
        return { type: "NoMinableResources" as const };
    }

    const resourceToMine = await inquirer.prompt([
      {
        type: "list",
        name: "resourceToMine",
        message: "Choose the resource to mine:",
        choices: minableResources.map((minableResource) => ({
            name: minableResource.mineItem.data.name,
            value: minableResource
        }))
      },
    ]);
  
    return { type: "Success" as const, data: resourceToMine.resourceToMine }
  };