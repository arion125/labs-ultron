#!/usr/bin/env node

import { version } from "./package.json";
import { cargo } from "./scripts/cargo";
import { mining } from "./scripts/mining";
import { SageFleetHandler } from "./src/SageFleetHandler";
import { getConnection } from "./utils/inputs/getConnection";
import { getKeypairFromSecret } from "./utils/inputs/getKeypairFromSecret";
import { inputProfile } from "./utils/inputs/inputProfile";
import { loadGame } from "./utils/inputs/loadGame";
import { setActivity } from "./utils/inputs/setActivity";
import { setFleet } from "./utils/inputs/setFleet";
import { setupProfileData } from "./utils/inputs/setupProfileData";

const main = async () => {
  console.log(`Welcome to Ultron ${version}!`);

  // qui l'utente sceglie il profilo desiderato
  const { profile } = await inputProfile();

  // qui si controlla se il profilo esiste già, se no, lo si crea
  await setupProfileData(profile);

  // qui si impostano il keypair e la connection
  const keypair = await getKeypairFromSecret(profile);

  const connection = getConnection(profile);

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

  switch (activity) {
    case "Mining":
      await mining(
        fleet.fleet,
        fleet.position,
        sageGameHandler,
        sageFleetHandler
      );
      break;
    case "Cargo":
      await cargo(
        fleet.fleet,
        fleet.position,
        sageGameHandler,
        sageFleetHandler
      );
      break;
    default:
      return;
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
