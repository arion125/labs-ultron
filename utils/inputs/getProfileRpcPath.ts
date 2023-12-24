import { rpcPaths } from "../../common/constants";

export const getProfileRpcPath = (profile: string) => {
  const path = rpcPaths[profile];
  if (!path) return { type: "RpcPathNotFound" as const };
  return { type: "Success" as const, result: path };
};
