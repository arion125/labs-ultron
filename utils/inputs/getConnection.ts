import { Connection } from "@solana/web3.js";
import { readFileSync } from "fs-extra";
import { verifiedRpc } from "../../common/constants";
import { getProfileRpcPath } from "./getProfileRpcPath";

export const getConnection = (profile: string) => {
  const rpcPath = getProfileRpcPath(profile);
  if (rpcPath.type !== "Success") return rpcPath;

  try {
    const rpcUrl = new URL(readFileSync(rpcPath.result).toString());
    if (!verifiedRpc.includes(rpcUrl.hostname) || rpcUrl.protocol !== "https:")
      return { type: "RpcUrlNotValid" as const };

    const connection = new Connection(rpcUrl.toString(), "confirmed");
    return { type: "Success" as const, result: connection };
  } catch (e) {
    return { type: "GetConnectionError" as const };
  }
};
