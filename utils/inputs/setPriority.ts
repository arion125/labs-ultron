import inquirer from "inquirer";
import { priority } from "../../common/constants";

export const setPriority = async () => {
    return inquirer.prompt<{ priority: string }>([
      {
        type: "list",
        name: "priority",
        message: "Set dynamic priority fee level:",
        choices: priority,
      },
    ]);
  };