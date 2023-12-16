import inquirer from "inquirer";
import {
  StarbaseInfoKey,
  findStarbaseNameByCoords,
} from "../../common/starbases";
import { getFleetAccountByName } from "../fleets/getFleetAccountByName";
import { getFleetPosition } from "../fleets/getFleetPosition";

export const setFleet = async () => {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "fleetName",
      message: "Enter the fleet name:",
      validate: async (input) => {
        const fleetAccount = await getFleetAccountByName(input);
        if (fleetAccount.type !== "Success")
          return "There is no fleet with this name. Please enter a valid fleet name.";

        const fleetPosition = await getFleetPosition(fleetAccount.fleet);
        if (
          fleetPosition.type !== "Success" ||
          !fleetAccount.fleet.state.StarbaseLoadingBay
        )
          return "The fleet is not in any starbase loading bay. Please enter a valid fleet name.";

        return true;
      },
    },
  ]);

  const fleetAccount = await getFleetAccountByName(answers.fleetName);
  if (fleetAccount.type !== "Success") return fleetAccount;

  const fleetPosition = await getFleetPosition(fleetAccount.fleet);
  if (fleetPosition.type !== "Success") return fleetPosition;

  const currentStarbaseName = findStarbaseNameByCoords(
    fleetPosition.position
  ) as StarbaseInfoKey;

  console.log(
    `Great. You have selected the fleet "${answers.fleetName}" located in ${currentStarbaseName}`
  );

  return {
    type: "Success" as const,
    fleet: fleetAccount.fleet,
    position: fleetPosition.position,
  };
};
