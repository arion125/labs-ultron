import inquirer from "inquirer";
import { ResourceType } from "../../common/resources";
import { StarbaseInfo, StarbaseInfoKey } from "../../common/starbases";
import { StarbaseResourceToMine } from "../../common/types";
import { setStarbase } from "./setStarbase";

export const setStarbaseAndResource = async (
  fleetStarbaseName: StarbaseInfoKey
): Promise<StarbaseResourceToMine> => {
  const starbase = await setStarbase(fleetStarbaseName);

  const resourceAnswer = await inquirer.prompt([
    {
      type: "list",
      name: "resourceToMine",
      message: "Choose the resource to mine:",
      choices: StarbaseInfo[starbase].resourcesToMine,
    },
  ]);

  const resourceToMine = resourceAnswer.resourceToMine as ResourceType;

  return { starbase, resourceToMine };
};
