import { PublicKey } from "@solana/web3.js";
import { byteArrayToString } from "@staratlas/data-source";
import inquirer from "inquirer";
import {
  StarbaseInfoKey,
  findStarbaseNameByCoords,
} from "../../common/starbases";
import { SageFleetHandler } from "../../src/SageFleetHandler";
import { SageGameHandler } from "../../src/SageGameHandler";
import { getFleetPosition } from "../fleets/getFleetPosition";

export const setFleet = async (
  gh: SageGameHandler,
  fh: SageFleetHandler,
  profilePubkey: PublicKey
) => {
  const fleets = await gh.findAllFleetsByPlayerProfile(profilePubkey);
  const dockedFleets = fleets.filter((fleet) => fleet.state.StarbaseLoadingBay);

  if (dockedFleets.length == 0) {
    console.log(
      `You don't have any docked fleet. Please dock a fleet and restart Ultron.`
    );
    return { type: "NoDockedFleets" as const };
  }

  const answers = await inquirer.prompt({
    type: "list",
    name: "selectedFleet",
    message: "Choose a fleet:",
    choices: dockedFleets.map((fleet) => {
      return {
        name: byteArrayToString(fleet.data.fleetLabel), // new TextDecoder().decode(Buffer.from(fleet.data.fleetLabel))
        value: fleet.key,
      };
    }),
  });

  const [selectedFleet] = dockedFleets.filter(
    (fleet) => fleet.key === answers.selectedFleet
  );
  const fleetName = byteArrayToString(selectedFleet.data.fleetLabel);

  const fleetPosition = await getFleetPosition(selectedFleet, fh);
  if (fleetPosition.type !== "Success") return fleetPosition;

  const currentStarbaseName = findStarbaseNameByCoords(
    fleetPosition.position
  ) as StarbaseInfoKey;

  console.log(
    `Great. You have selected the fleet "${fleetName}" located in ${currentStarbaseName}`
  );

  return {
    type: "Success" as const,
    fleet: selectedFleet,
    position: fleetPosition.position,
  };
};
