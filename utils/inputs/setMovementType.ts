import inquirer from "inquirer";

export const setMovementType = async (): Promise<string> => {
  const movements = ["Subwarp", "Warp - only for one-shot travel (alpha)"];

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
