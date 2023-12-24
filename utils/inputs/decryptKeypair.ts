import { Keypair, PublicKey } from "@solana/web3.js";
import { readFileSync } from "fs-extra";
import { EncryptedData } from "../../common/types";
import { decrypt } from "../crypto";
import { getProfileKeypairPath } from "./getProfileKeypairPath";

export const decryptKeypair = (secret: Buffer, profile: string) => {
  const keypairPath = getProfileKeypairPath(profile);
  if (keypairPath.type !== "Success") return keypairPath;

  try {
    const fileContent = readFileSync(keypairPath.result).toString();
    const encryptedKeypair = JSON.parse(fileContent) as EncryptedData;

    if (
      !encryptedKeypair.iv ||
      !encryptedKeypair.content ||
      !encryptedKeypair.salt ||
      !encryptedKeypair.tag
    )
      return {
        type: "EncryptedKeypairParsingError" as const,
      };

    const decryptedKeypair = decrypt(encryptedKeypair, secret);
    if (decryptedKeypair.type !== "Success") return decryptedKeypair;

    const keypair = Keypair.fromSecretKey(
      Uint8Array.from(decryptedKeypair.result)
    );

    if (!PublicKey.isOnCurve(keypair.publicKey.toBytes())) {
      return { type: "KeypairIsNotOnCurve" as const };
    }

    return { type: "Success" as const, result: keypair };
  } catch (e) {
    return { type: "DecryptKeypairError" as const };
  }
};
