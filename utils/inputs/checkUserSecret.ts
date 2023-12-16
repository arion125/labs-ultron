import { Keypair, PublicKey } from "@solana/web3.js";
import { readFileSync } from "fs-extra";
import inquirer from "inquirer";
import {
  keypairPath1,
  keypairPath2,
  keypairPath3,
} from "../../common/constants";
import { EncryptedData } from "../../common/types";
import StateManager from "../../src/StateManager";
import { decrypt } from "../crypto";

export const checkUserSecret = () => {
  const profile = StateManager.getInstance().getProfile();
  return inquirer.prompt([
    {
      type: "password",
      name: "userSecret",
      message: "Enter your password to start:",
      validate: (input) => {
        const keypairPath =
          profile === "Profile 1"
            ? keypairPath1
            : profile === "Profile 2"
            ? keypairPath2
            : profile === "Profile 3"
            ? keypairPath3
            : "";

        const encryptedKeypair = JSON.parse(
          readFileSync(keypairPath).toString()
        ) as EncryptedData;

        if (
          !encryptedKeypair.iv ||
          !encryptedKeypair.content ||
          !encryptedKeypair.salt ||
          !encryptedKeypair.tag
        )
          return "Encrypted keypair parsing error. Please delete the keypair.json file in .ultronConfig folder and restart Ultron.";

        try {
          const decryptedKeypair = decrypt(encryptedKeypair, input);

          const keypair = Keypair.fromSecretKey(
            Uint8Array.from(decryptedKeypair)
          );

          if (!PublicKey.isOnCurve(keypair.publicKey.toBytes())) {
            throw new Error("WalletKeypairIsNotOnCurve");
          }

          return true;
        } catch (e) {
          return "Wrong password, please try again.";
        }
      },
    },
  ]);
};
