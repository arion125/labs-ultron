import { Connection, Keypair } from "@solana/web3.js";
import { SageGameHandler } from "../../src/SageGameHandler";

export const loadGame = async (keypair: Keypair, connection: Connection) => {
  const sageGameHandler = new SageGameHandler(keypair, connection);
  await sageGameHandler.ready;
  await sageGameHandler.loadGame();

  return sageGameHandler;
};
