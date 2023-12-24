import inquirer from "inquirer";
import { profiles } from "../../common/constants";

export const inputProfile = () => {
  return inquirer.prompt([
    {
      type: "list",
      name: "profile",
      message: "Choose the profile to use:",
      choices: profiles,
    },
  ]);
};
