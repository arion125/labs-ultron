import { existsSync } from "fs-extra";
import inquirer from "inquirer";
import {
  keypairPath1,
  keypairPath2,
  keypairPath3,
} from "../../common/constants";
import StateManager from "../../src/StateManager";

export const setUsageDisclaimer = () => {
  const profile = StateManager.getInstance().getProfile();
  if (
    (profile === "Profile 1" && existsSync(keypairPath1)) ||
    (profile === "Profile 2" && existsSync(keypairPath2)) ||
    (profile === "Profile 3" && existsSync(keypairPath3))
  ) {
    return Promise.resolve();
  }

  console.log(
    "Use of this tool is entirely at your own risk. A private key is required for the tool to function properly. The creator of this tool assumes no responsibility for any misuse or any consequences that arise from its use."
  );
  return inquirer.prompt([
    {
      type: "confirm",
      name: "usageDisclaimer",
      message:
        "Do you understand and accept the risks associated with using this tool, as outlined in the warning above?",
    },
  ]);
};
