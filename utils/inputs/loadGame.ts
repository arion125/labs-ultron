import { Connection, Keypair } from "@solana/web3.js";
import { SageGameHandler } from "../../src/SageGameHandler";

export const loadGame = async (keypair: Keypair, connection: Connection, priority: string = "Default") => {
  const sageGameHandler = new SageGameHandler(keypair, connection, priority);
  await sageGameHandler.ready;
  await sageGameHandler.loadGame();

  return sageGameHandler;
};
