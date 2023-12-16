import inquirer from "inquirer";
import { Resource, ResourceKey } from "../../common/resources";
import { InputResourcesForCargo } from "../../common/types";

const processInput = async (
  input: string
): Promise<InputResourcesForCargo[]> => {
  const resourcePairs = input.split(",");
  const resources: InputResourcesForCargo[] = [];

  for (const pair of resourcePairs) {
    const regex = /(\w+)\s+(\d+)/;
    const match = regex.exec(pair.trim());

    if (match) {
      const resource = match[1] as ResourceKey;
      if (!Resource[resource]) return [];
      resources.push({
        resource: Resource[resource],
        amount: parseInt(match[2], 10),
      });
    } else {
      return [];
    }
  }

  return resources;
};

export const setResourcesAmount = async (
  promptMessage: string
): Promise<InputResourcesForCargo[]> => {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "resources",
      message: promptMessage,
      validate: (input) => {
        if (!input) {
          return true;
        }
        return processInput(input).then((processedResources) => {
          if (processedResources.length > 0) {
            return true;
          }
          return "Invalid resources, please try again.";
        });
      },
    },
  ]);

  const resources = answers.resources;
  if (!resources) return [];
  return processInput(resources);
};
