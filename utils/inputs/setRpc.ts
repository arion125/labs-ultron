import {
  chmodSync,
  existsSync,
  outputFileSync,
  readFileSync,
  removeSync,
} from "fs-extra";
import inquirer from "inquirer";
import { verifiedRpc } from "../../common/constants";

export const setRpc = (rpcPath: string) => {
  if (existsSync(rpcPath)) {
    const rpcUrl = new URL(readFileSync(rpcPath).toString());
    if (verifiedRpc.includes(rpcUrl.hostname) && rpcUrl.protocol === "https:")
      return Promise.resolve();

    removeSync(rpcPath);
  }

  return inquirer.prompt([
    {
      type: "input",
      name: "rpcUrl",
      message: "Enter your rpc url:",
      validate: (input) => {
        try {
          const rpc = new URL(input);
          if (!verifiedRpc.includes(rpc.hostname) || rpc.protocol !== "https:")
            return "Wrong rpc url, please retry again";
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
