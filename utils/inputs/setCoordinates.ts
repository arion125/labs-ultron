import inquirer from "inquirer";
import { SectorCoordinates } from "../../common/types";
import { BN } from "@project-serum/anchor";

export const setCoordinates = async (): Promise<SectorCoordinates> => {
  const answerX = await inquirer.prompt([
    {
      type: "input",
      name: "coordinate",
      message: "Enter coordinates to start scan. Choose X (Beetwen -50 and 50):",
      validate: (input) => {
        if (parseInt(input) >= -50 && parseInt(input) <= 50) return true;
        return "Please input a valid number.";
      },
    },
  ]);

  const answerY = await inquirer.prompt([
    {
      type: "input",
      name: "coordinate",
      message: "Enter coordinates to start scan. Choose Y (Beetwen -50 and 50):",
      validate: (input) => {
        if (parseInt(input) >= -50 && parseInt(input) <= 50) return true;
        return "Please input a valid number.";
      },
    },
  ]);

  const x = parseInt(answerX.coordinate);
  const y = parseInt(answerY.coordinate);

  return [new BN(x), new BN(y)] as SectorCoordinates;
};
