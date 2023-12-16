import { chmodSync, existsSync, outputFileSync } from "fs-extra";
import inquirer from "inquirer";
import { rpcPath1, rpcPath2, rpcPath3, rpcPaths } from "../../common/constants";
import StateManager from "../../src/StateManager";

export const setRpc = () => {
  const profile = StateManager.getInstance().getProfile();
  if (
    (profile === "Profile 1" && existsSync(rpcPath1)) ||
    (profile === "Profile 2" && existsSync(rpcPath2)) ||
    (profile === "Profile 3" && existsSync(rpcPath3))
  ) {
    return Promise.resolve();
  }

  return inquirer.prompt([
    {
      type: "input",
      name: "rpcUrl",
      message: "Enter your rpc url:",
      validate: (input) => {
        try {
          const rpc = new URL(input);

          const rpcPath = rpcPaths[profile] || "";

          outputFileSync(rpcPath, rpc.toString());
          chmodSync(rpcPath, 0o600);
          return true;
        } catch (e) {
          return "Wrong rpc url, please retry again";
        }
      },
    },
  ]);
};
