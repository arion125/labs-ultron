import { Connection, Keypair } from "@solana/web3.js";
import { readFileSync } from "fs";
import { keypairPaths, rpcPaths } from "../common/constants";
import { EncryptedData } from "../common/types";
import StateManager from "../src/StateManager";
import { decrypt } from "./crypto";

export const setupWallet = async () => {
  const profile = StateManager.getInstance().getProfile();
  const userSecret = StateManager.getInstance().getUserSecret();

  const rpcPath = rpcPaths[profile] || "";

  const rpcUrl = readFileSync(rpcPath).toString();
  const connection = new Connection(rpcUrl, "confirmed");

  const keypairPath = keypairPaths[profile] || "";

  const encryptedKeypair = JSON.parse(
    readFileSync(keypairPath).toString()
  ) as EncryptedData;

  const keypair = Keypair.fromSecretKey(
    Uint8Array.from(decrypt(encryptedKeypair, userSecret))
  );

  return { connection, keypair };
};
