import { SageGameHandler } from "../../src/SageGameHandler";

export const checkConnectionAndGameState = async (gh: SageGameHandler) => {
  if (!gh.provider.connection) return { type: "RPCConnectionError" as const };
  if (!gh.game) return { type: "GameIsNotLoaded" as const };

  return { type: "Success" as const };
};
