import { keypairPaths } from "../../common/constants";

export const getProfileKeypairPath = (profile: string) => {
  const path = keypairPaths[profile];
  if (!path) return { type: "KeypairPathNotFound" as const };
  return { type: "Success" as const, result: path };
};
