import { PublicKey } from "@solana/web3.js";
import { homedir } from "os";
import path from "path";
import { KeypairPath, RpcPath } from "./types";

export const MAX_AMOUNT = 999_999_999;

export const quattrinoTokenPubkey = new PublicKey(
  "qtr6BUeMKtt65HdYxXm75fLZ19184w4Yh4ZaPp4Ppks"
);

export const configDir1 = path.join(homedir(), ".ultronConfig1");
export const configDir2 = path.join(homedir(), ".ultronConfig2");
export const configDir3 = path.join(homedir(), ".ultronConfig3");

export const keypairPath1 = path.join(configDir1, "keypair.json");
export const keypairPath2 = path.join(configDir2, "keypair.json");
export const keypairPath3 = path.join(configDir3, "keypair.json");

export const rpcPath1 = path.join(configDir1, "rpc.txt");
export const rpcPath2 = path.join(configDir2, "rpc.txt");
export const rpcPath3 = path.join(configDir3, "rpc.txt");

export const rpcPaths: RpcPath = {
  "Profile 1": rpcPath1,
  "Profile 2": rpcPath2,
  "Profile 3": rpcPath3,
};

export const keypairPaths: KeypairPath = {
  "Profile 1": keypairPath1,
  "Profile 2": keypairPath2,
  "Profile 3": keypairPath3,
};
