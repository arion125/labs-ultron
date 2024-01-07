import inquirer from "inquirer";

export const setMovementType = async (): Promise<string> => {
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
      message: "Choose the fleet movement type:",
      choices: movements,
    },
  ]);

  const movement = answer.movement;

  return movement;
};
