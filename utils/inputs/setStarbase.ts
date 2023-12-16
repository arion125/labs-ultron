import inquirer from "inquirer";
import { StarbaseInfo, StarbaseInfoKey } from "../../common/starbases";

export const setStarbase = async (
  currentStarbase: StarbaseInfoKey,
  excludeCurrentStarbase?: boolean
): Promise<StarbaseInfoKey> => {
  const starbaseChoices = Object.keys(StarbaseInfo);

  const starbaseAnswer = await inquirer.prompt([
    {
      type: "list",
      name: "starbaseDestination",
      message: "Choose the starbase destination:",
      choices: !excludeCurrentStarbase
        ? starbaseChoices.map((item) => ({
            name:
              item === currentStarbase ? `${item} (current starbase)` : item,
            value: item,
          }))
        : starbaseChoices.filter((item) => item !== currentStarbase), // TODO: add AU distance from currentStarbase
    },
  ]);

  const starbase = starbaseAnswer.starbaseDestination as StarbaseInfoKey;

  return starbase;
};
