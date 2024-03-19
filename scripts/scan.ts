import { PublicKey } from "@solana/web3.js";
import { byteArrayToString } from "@staratlas/data-source";
import { dockToStarbase } from "../actions/dockToStarbase";
import { exitSubwarp } from "../actions/exitSubwarp";
import { exitWarp } from "../actions/exitWarp";
import { loadCargo } from "../actions/loadCargo";
import { loadFuel } from "../actions/loadFuel";
import { scanSdu } from "../actions/scanSdu";
import { subwarpToSector } from "../actions/subwarpToSector";
import { undockFromStarbase } from "../actions/undockFromStarbase";
import { unloadCargo } from "../actions/unloadCargo";
import { warpToSector } from "../actions/warpToSector";
import { MAX_AMOUNT } from "../common/constants";
import { NotificationMessage } from "../common/notifications";
import { Resource } from "../common/resources";
import { SageFleetHandler } from "../src/SageFleetHandler";
import { SageGameHandler } from "../src/SageGameHandler";
import { actionWrapper } from "../utils/actions/actionWrapper";
import { sendNotification } from "../utils/actions/sendNotification";
import { wait } from "../utils/actions/wait";
// import { getBestScanSector } from "../utils/fleets/getBestScanSector";
import { getScanConfig } from "../utils/fleets/getScanConfig";
import { setFleet } from "../utils/inputs/setFleet";
import { setScanInputs } from "../utils/inputs/setScanInputs";
import { canGoAndComeBack } from "../utils/sectors/canGoAndComeBack";
import { generateRoute } from "../utils/sectors/generateRoute";
import { sameCoordinates } from "../utils/sectors/sameCoordinates";
import { getFleetPosition } from "../utils/fleets/getFleetPosition";
import { getCargoUsage } from "../utils/fleets/getCargoUsage";

export const scan = async (
  profilePubkey: PublicKey,
  gh: SageGameHandler,
  fh: SageFleetHandler,
  cycles: number
) => {
  // 1. prendere in input tutti i dati necessari per scan SDU
  // - quale flotta vuoi usare
  // - dove vuoi andare
  // - vuoi spostarti in warp o subwarp (calcolare la rotta)
  const fleetResponse = await setFleet(
    gh,
    fh,
    profilePubkey,
  );
  if (fleetResponse.type !== "Success") return fleetResponse;
  const fleet = fleetResponse.fleet;
  const position = fleetResponse.position;

  const fleetShips = await fh.getFleetShipsAccount(fleet.data.fleetShips);

  if (fleetShips.type !== "Success") return fleetShips;

  const fleetShipsData = fleetShips.fleetShips.fleetShips;

  const fleetShipsMint = [];
  let allSuccess = true;

  for (const ship of fleetShipsData) {
    const shipAccount = await fh.getShipAccount(ship.ship);
    if (shipAccount.type !== "Success") {
      allSuccess = false;
      break;
    }
    fleetShipsMint.push(shipAccount.ship.data.mint);
  }
  if (!allSuccess) return { type: "NotAllShipAccountsFetched" as const };

  // console.log("Fleet ships:", fleetShipsMint.map((ship) => ship.toBase58()));

  const filterDataRunner = fleetShipsMint.filter((ship) => 
    !ship.equals(new PublicKey("9czEqEZ4EkRt7N3HWDcw9qqwys3xRRjGdbn8Jhk8Khwj")) && 
    !ship.equals(new PublicKey("RaYfM1RLfxQJWF8RZravTshKj1aHaWBNXF94VWToY9n"))
  );

  const onlyDataRunner = filterDataRunner.length === 0;
  console.log("Is a only data runner fleet?:", onlyDataRunner ? "Yes (auto-computed)" : "No (auto-computed)");

  const {
    searchBehavior,
    sectorTo,
    movementType,
    // subMovementType,
  } = await setScanInputs(position);

  // 2. calcolare tutti i dati necessari correlati agli input
  const fleetPubkey = fleet.key;
  const fleetName = byteArrayToString(fleet.data.fleetLabel);
  
  const scanConfig = await getScanConfig(fleet/* sectorTo, searchBehavior */);

  // 3. avviare l'automazione utilizzando i dati forniti dall'utente
  for (let i = 0; i < cycles; i++) {
    try {
      await actionWrapper(loadFuel, fleetPubkey, MAX_AMOUNT, gh, fh);

      let routeStart = sectorTo
        ? await generateRoute(
            fleetPubkey,
            position,
            sectorTo,
            movementType == "warp",
            gh,
            fh
          )
        : { type: "Success" as const, result: [] };
      if (routeStart.type !== "Success") return routeStart;

      let routeBack = sectorTo
        ? await generateRoute(
            fleetPubkey,
            sectorTo,
            position,
            movementType == "warp",
            gh,
            fh
          )
        : { type: "Success" as const, result: [] };
      if (routeBack.type !== "Success") return routeBack;

      if (!onlyDataRunner) {
        await actionWrapper(
          loadCargo,
          fleetPubkey,
          Resource.Tool,
          MAX_AMOUNT,
          gh,
          fh
        );
      }

      await actionWrapper(undockFromStarbase, fleetPubkey, gh, fh);

      if (sectorTo && movementType !== "") {
        for (const trip of routeStart.result) {
          if (trip.warp) {
            await actionWrapper(
              warpToSector,
              fleetPubkey,
              trip.from,
              trip.to,
              gh,
              fh,
              !trip.to[0].eq(sectorTo[0]) || !trip.to[1].eq(sectorTo[1])
            );
            await actionWrapper(exitWarp, fleetPubkey, gh, fh);
          }
          if (!trip.warp) {
            await actionWrapper(
              subwarpToSector,
              fleetPubkey,
              trip.from,
              trip.to,
              gh,
              fh
            );
            await actionWrapper(exitSubwarp, fleetPubkey, gh, fh);
          }
        }
      }

      if (onlyDataRunner) {
        for (let i = 0; i < 999_999; i++) {
          const cargoState = await getCargoUsage(fleet, gh);
          
          if (cargoState.type !== "Success") return cargoState;
          
          if (cargoState.currentFleetCargoAmount >= cargoState.cargoCapacity) 
            break;

          console.log(" ");
          console.log("Total cargo capacity:", cargoState.cargoCapacity);
          console.log("Current cargo usage:", cargoState.currentFleetCargoAmount);
          await actionWrapper(
            scanSdu,
            fleetPubkey,
            gh,
            fh,
            scanConfig.scanCoolDown,
            onlyDataRunner
          );
        }
      }

      if (!onlyDataRunner) {
        for (let i = 0; i < scanConfig.maxScanAvailable; i++) {
          console.log(" ");
          console.log(`${i + 1}/${scanConfig.maxScanAvailable}`)
          await actionWrapper(
            scanSdu,
            fleetPubkey,
            gh,
            fh,
            scanConfig.scanCoolDown
          );
        }
      }

      if (sectorTo && movementType !== "") {
        for (const trip of routeBack.result) {
          if (trip.warp) {
            await actionWrapper(
              warpToSector,
              fleetPubkey,
              trip.from,
              trip.to,
              gh,
              fh,
              true
            );
            await actionWrapper(exitWarp, fleetPubkey, gh, fh);
          }
          if (!trip.warp) {
            await actionWrapper(
              subwarpToSector,
              fleetPubkey,
              trip.from,
              trip.to,
              gh,
              fh
            );
            await actionWrapper(exitSubwarp, fleetPubkey, gh, fh);
          }
        }
      }

      await actionWrapper(dockToStarbase, fleetPubkey, gh, fh);

      if (!onlyDataRunner) {
        await actionWrapper(
          unloadCargo,
          fleetPubkey,
          Resource.Tool,
          MAX_AMOUNT,
          gh,
          fh
        );
      }

      await actionWrapper(
        unloadCargo,
        fleetPubkey,
        Resource.Sdu,
        MAX_AMOUNT,
        gh,
        fh
      );

      await sendNotification(NotificationMessage.SCAN_SUCCESS, fleetName);  
    } catch (e) {
      await sendNotification(NotificationMessage.SCAN_ERROR, fleetName);
      break;
    }
  }

  return { type: "Success" as const };
};
