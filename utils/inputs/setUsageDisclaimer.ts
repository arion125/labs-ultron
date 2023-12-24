import { existsSync, readFileSync, removeSync } from "fs-extra";
import inquirer from "inquirer";
import { EncryptedData } from "../../common/types";

export const setUsageDisclaimer = (keypairPath: string) => {
  if (existsSync(keypairPath)) {
    const fileContent = readFileSync(keypairPath).toString();
    const encryptedKeypair = JSON.parse(fileContent) as EncryptedData;

    if (
      encryptedKeypair.iv &&
      encryptedKeypair.content &&
      encryptedKeypair.salt &&
      encryptedKeypair.tag
    )
      return Promise.resolve();

    removeSync(keypairPath);
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
