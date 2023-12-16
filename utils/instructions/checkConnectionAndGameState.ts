import { sageProvider } from "../sageProvider";

export const checkConnectionAndGameState = async () => {
  const { sageGameHandler } = await sageProvider();

  if (!sageGameHandler.provider.connection)
    return { type: "RPCConnectionError" as const };
  if (!sageGameHandler.game) return { type: "GameIsNotLoaded" as const };

  return { type: "Success" as const };
};
