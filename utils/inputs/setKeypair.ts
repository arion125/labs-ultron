import { Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { existsSync, outputFileSync } from "fs-extra";
import inquirer, { QuestionCollection } from "inquirer";
import {
  keypairPath1,
  keypairPath2,
  keypairPath3,
} from "../../common/constants";
import StateManager from "../../src/StateManager";
import { encrypt } from "../crypto";

export const setKeypair = () => {
  const profile = StateManager.getInstance().getProfile();

  if (
    (profile === "Profile 1" && existsSync(keypairPath1)) ||
    (profile === "Profile 2" && existsSync(keypairPath2)) ||
    (profile === "Profile 3" && existsSync(keypairPath3))
  ) {
    return Promise.resolve();
  }

  const questions: QuestionCollection = [
    {
      type: "password",
      name: "secretKey",
      message: "Enter your base58 wallet private key:",
      validate: (input) => {
        try {
          const keypair = Keypair.fromSecretKey(bs58.decode(input));

          if (!PublicKey.isOnCurve(keypair.publicKey.toBytes()))
            throw new Error("WalletKeypairIsNotOnCurve");

          return true;
        } catch (e) {
          return "Wrong private key, please retry again";
        }
      },
    },
    {
      type: "password",
      name: "userSecret",
      message:
        "Enter a password (at least 8 characters with one capital, one number and one special character) to encrypt your private key. Be sure to save it in a safe place and do not share it with anyone:",
      validate: (input, answers) => {
        if (answers) {
          const hasUpperCase = /[A-Z]/.test(input);
          const hasLowerCase = /[a-z]/.test(input);
          const hasNumber = /\d/.test(input);
          const hasSpecialChar = /\W/.test(input);
          const keypair = Keypair.fromSecretKey(bs58.decode(answers.secretKey));

          if (
            input.length >= 8 &&
            hasUpperCase &&
            hasLowerCase &&
            hasNumber &&
            hasSpecialChar &&
            input !== keypair.secretKey.toString() &&
            input !== keypair.publicKey.toString()
          ) {
            return true;
          }
          return "The password must contain at least 8 characters with at least one capital, one number, one special character and can't be equal to wallet's private or public key.";
        }
      },
    },
    {
      type: "password",
      name: "confirmUserSecret",
      message: "Confirm your password:",
      validate: (input, answers) => {
        if (answers && input === answers.userSecret) {
          const keypair = Keypair.fromSecretKey(bs58.decode(answers.secretKey));

          const encryptedKeypair = encrypt(
            keypair.secretKey,
            answers.userSecret
          );
          const keypairPath =
            profile === "Profile 1"
              ? keypairPath1
              : profile === "Profile 2"
              ? keypairPath2
              : profile === "Profile 3"
              ? keypairPath3
              : "";

          outputFileSync(keypairPath, JSON.stringify(encryptedKeypair));

          return true;
        }
        return "Passwords don't match. If you didn't remember the first password, restart Ultron.";
      },
    },
  ];

  return inquirer.prompt(questions);
};
