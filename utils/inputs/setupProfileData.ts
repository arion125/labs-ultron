import { getProfileKeypairPath } from "./getProfileKeypairPath";
import { getProfileRpcPath } from "./getProfileRpcPath";
import { setKeypair } from "./setKeypair";
import { setRpc } from "./setRpc";
import { setUsageDisclaimer } from "./setUsageDisclaimer";

export const setupProfileData = async (profile: string) => {
  const keypairPath = getProfileKeypairPath(profile);
  const rpcPath = getProfileRpcPath(profile);

  if (!keypairPath.result || !rpcPath.result)
    return { tpye: "InvalidProfile" as const };

  await setUsageDisclaimer(keypairPath.result);
  await setKeypair(keypairPath.result);
  await setRpc(rpcPath.result);
};
