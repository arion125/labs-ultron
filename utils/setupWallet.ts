import { Connection, Keypair } from "@solana/web3.js";
import { readFileSync } from "fs";
import {
  keypairPath1,
  keypairPath2,
  keypairPath3,
  rpcPath1,
  rpcPath2,
  rpcPath3,
} from "../common/constants";
import { EncryptedData } from "../common/types";
import StateManager from "../src/StateManager";
import { decrypt } from "./crypto";

export const setupWallet = async () => {
  const profile = StateManager.getInstance().getProfile();
  const userSecret = StateManager.getInstance().getUserSecret();

  const rpcPath =
    profile === "Profile 1"
      ? rpcPath1
      : profile === "Profile 2"
      ? rpcPath2
      : profile === "Profile 3"
      ? rpcPath3
      : "";

  const rpcUrl = readFileSync(rpcPath).toString();
  const connection = new Connection(rpcUrl, "confirmed");

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

  const keypair = Keypair.fromSecretKey(
    Uint8Array.from(decrypt(encryptedKeypair, userSecret))
  );

  return { connection, keypair };
};
