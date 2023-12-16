import { sageProvider } from "../sageProvider";

export const getFleetAccountByName = async (fleetName: string) => {
  const { sageGameHandler, sageFleetHandler, playerProfilePubkey } =
    await sageProvider();

  const fleetPubkey = sageGameHandler.getFleetAddress(
    playerProfilePubkey,
    fleetName
  );

  const fleetAccount = await sageFleetHandler.getFleetAccount(fleetPubkey);
  return fleetAccount;
};
