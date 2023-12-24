import { PublicKey } from "@solana/web3.js";
import inquirer from "inquirer";
import {
  StarbaseInfoKey,
  findStarbaseNameByCoords,
} from "../../common/starbases";
import { SageFleetHandler } from "../../src/SageFleetHandler";
import { SageGameHandler } from "../../src/SageGameHandler";
import { getFleetAccountByName } from "../fleets/getFleetAccountByName";
import { getFleetPosition } from "../fleets/getFleetPosition";

export const setFleet = async (
  gh: SageGameHandler,
  fh: SageFleetHandler,
  profilePubkey: PublicKey
) => {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "fleetName",
      message: "Enter the fleet name:",
      validate: async (input) => {
        const fleetAccount = await getFleetAccountByName(
          input,
          gh,
          fh,
          profilePubkey
        );
        if (fleetAccount.type !== "Success")
          return "There is no fleet with this name. Please enter a valid fleet name.";

        const fleetPosition = await getFleetPosition(fleetAccount.fleet, fh);
        if (
          fleetPosition.type !== "Success" ||
          !fleetAccount.fleet.state.StarbaseLoadingBay
        )
          return "The fleet is not in any starbase loading bay. Please enter a valid fleet name.";

        return true;
      },
    },
  ]);

  const fleetAccount = await getFleetAccountByName(
    answers.fleetName,
    gh,
    fh,
    profilePubkey
  );
  if (fleetAccount.type !== "Success") return fleetAccount;

  const fleetPosition = await getFleetPosition(fleetAccount.fleet, fh);
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
