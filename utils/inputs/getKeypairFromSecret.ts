import { Keypair } from "@solana/web3.js";
import inquirer from "inquirer";
import { decryptKeypair } from "./decryptKeypair";

export const getKeypairFromSecret = async (
  profile: string
): Promise<Keypair> => {
  const answer = await inquirer.prompt([
    {
      type: "password",
      name: "secret",
      message: "Enter your password to start:",
      validate: (input) => {
        const secret = Buffer.from(input);
        const keypair = decryptKeypair(secret, profile);
        if (keypair.type !== "Success")
          return "Wrong password or incorrect keypair, please retry";
        return true;
      },
    },
  ]);

  const secret = Buffer.from(answer.secret);
  const keypair = decryptKeypair(secret, profile);
  return keypair.result as Keypair;
};
