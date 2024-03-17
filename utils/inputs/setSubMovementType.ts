import inquirer from "inquirer";

export const setSubMovementType = async (): Promise<string> => {
  const movements = [
    {
      name: "Subwarp",
      value: "subwarp",
    },
    {
      name: "Warp",
      value: "warp",
    },
  ];

  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "movement",
      message: "Choose the fleet movement type searching for SDU:",
      choices: movements,
    },
  ]);

  const movement = answer.movement;

  return movement;
};
