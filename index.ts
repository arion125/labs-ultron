#!/usr/bin/env node

import { Connection, Keypair } from "@solana/web3.js";
import { version } from "./package.json";
import { cargo } from "./scripts/cargo";
import { mining } from "./scripts/mining";
import { SageFleetHandler } from "./src/SageFleetHandler";
import { SageGame } from "./src/SageGame";
import { getConnection } from "./utils/inputs/getConnection";
import { getKeypairFromSecret } from "./utils/inputs/getKeypairFromSecret";
import { inputProfile } from "./utils/inputs/inputProfile";
import { loadGame } from "./utils/inputs/loadGame";
import { resetProfile } from "./utils/inputs/resetProfile";
import { setActivity } from "./utils/inputs/setActivity";
import { setCycles } from "./utils/inputs/setCycles";
import { setFleet } from "./utils/inputs/setFleet";
import { setStart } from "./utils/inputs/setStart";
import { setupProfileData } from "./utils/inputs/setupProfileData";

const main = async () => {
  console.log(`Welcome to Ultron ${version}!`);

  const { startOption } = await setStart();

  if (startOption === "Settings") {
    await resetProfile();
    return;
  }

  // qui l'utente sceglie il profilo desiderato
  const { profile } = await inputProfile();

  // qui si controlla se il profilo esiste già, se no, lo si crea
  await setupProfileData(profile);

  // qui si impostano il keypair e la connection
  const keypair = await getKeypairFromSecret(profile);

  const connection = getConnection(profile);

  // FIX: se la connessione non è andata a buon fine, Ultron riprova
  if (connection.type !== "Success") {
    return;
  }

  // qui comincia lo script
  const sageGameHandler = await loadGame(keypair, connection.result);
  const sageFleetHandler = new SageFleetHandler(sageGameHandler);
  const profilePubkey = await sageGameHandler.getPlayerProfileAddress(
    keypair.publicKey
  );

  console.log("You're in! Let's go");

  const qttrBalance = await sageGameHandler.getQuattrinoBalance();
  if (qttrBalance.type !== "Success" || qttrBalance.tokenBalance == 0) return;

  const fleet = await setFleet(
    sageGameHandler,
    sageFleetHandler,
    profilePubkey
  );
  if (fleet.type !== "Success") return;

  const activity = await setActivity();

  const cycles = await setCycles();

  switch (activity) {
    case "Mining":
      while (true) {
        const m = await mining(
          fleet.fleet,
          fleet.position,
          sageGameHandler,
          sageFleetHandler,
          cycles
        );
        if (m.type !== "Success") console.log(m.type);
        if (m.type === "Success") break;
      }
      break;
    case "Cargo":
      while (true) {
        const c = await cargo(
          fleet.fleet,
          fleet.position,
          sageGameHandler,
          sageFleetHandler,
          cycles
        );
        if (c.type !== "Success") console.log(c.type);
        if (c.type === "Success") break;
      }
      break;
    default:
      return;
  }
};

/* main().catch((err) => {
  console.error(err);
  process.exit(1);
}); */

const test = async () => {
  const keypair = Keypair.generate()

  const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=459e67eb-87a7-43dd-bc5c-c6a8dcf42af7")

  const sage = new SageGame(keypair, connection);

  const data = await sage.getAllStarbasesAccount()

  console.log(data);
}

test().catch((err) => {
  console.error(err);
  process.exit(1);
});