import crypto from "crypto";
import { EncryptedData } from "../common/types";

const algorithm = "aes-256-gcm";

export const encrypt = (secretKey: crypto.BinaryLike, userSecret: string) => {
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(userSecret, salt, 100000, 32, "sha256");

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, hash, iv);

  let encrypted = cipher.update(secretKey);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString("hex"),
    salt: salt.toString("hex"),
    content: encrypted.toString("hex"),
    tag: authTag.toString("hex"),
  };
};

export const decrypt = (
  encryptedKeypair: EncryptedData,
  userSecret: string
) => {
  const salt = Buffer.from(encryptedKeypair.salt, "hex");
  const hash = crypto.pbkdf2Sync(userSecret, salt, 100000, 32, "sha256");

  const iv = Buffer.from(encryptedKeypair.iv, "hex");
  const encryptedText = Buffer.from(encryptedKeypair.content, "hex");
  const authTag = Buffer.from(encryptedKeypair.tag, "hex");

  const decipher = crypto.createDecipheriv(algorithm, hash, iv);
  decipher.setAuthTag(authTag);

  try {
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted;
  } catch (error) {
    throw new Error("UnableToDecryptData");
  }
};
