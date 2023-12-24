import { Connection } from "@solana/web3.js";
import { checkRpcFile } from "./checkRpcFile";
import { getProfileRpcPath } from "./getProfileRpcPath";

export const getConnection = (profile: string) => {
  const rpcPath = getProfileRpcPath(profile);
  if (rpcPath.type !== "Success") return rpcPath;

  try {
    const cr = checkRpcFile(rpcPath.result);
    if (cr.type === "InvalidRpcUrl") return cr;
    if (cr.type === "RpcFileNotFound") return cr;

    const connection = new Connection(cr.result.toString(), "confirmed");
    return { type: "Success" as const, result: connection };
  } catch (e) {
    return { type: "GetConnectionError" as const };
  }
};
