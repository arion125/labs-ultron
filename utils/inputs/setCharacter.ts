import inquirer from "inquirer";
import { GetProgramAccountsResponse, PublicKey } from "@solana/web3.js";

export const setCharacter = async (
  profileAccounts: GetProgramAccountsResponse
): Promise<PublicKey> => {
  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "character",
      message: "Choose character:",
      choices: profileAccounts.map(account => account.pubkey.toBase58()),
    },
  ]);

  const character = answer.character;

  return new PublicKey(character);
};