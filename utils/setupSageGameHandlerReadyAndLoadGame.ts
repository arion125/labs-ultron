import { Connection, Keypair } from "@solana/web3.js";
import { SageGameHandler } from "../src/SageGameHandler";

export const setupSageGameHandlerReadyAndLoadGame = async (
  walletKeypair: Keypair,
  connection: Connection
) => {
  const sageGameHandler = new SageGameHandler(walletKeypair, connection);
  await sageGameHandler.ready;
  await sageGameHandler.loadGame();

  const playerPubkey = walletKeypair.publicKey;

  return { sageGameHandler, playerPubkey };
};
