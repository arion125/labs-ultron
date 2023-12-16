import inquirer from "inquirer";

export const setConfigProfile = () => {
  const configChoices = ["Profile 1", "Profile 2", "Profile 3"];

  return inquirer.prompt([
    {
      type: "list",
      name: "profile",
      message: "Choose the profile to use:",
      choices: configChoices,
    },
  ]);
};
