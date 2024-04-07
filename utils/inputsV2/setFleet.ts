import { SageFleet } from "../../src/SageFleet";
import { SagePlayer } from "../../src/SagePlayer";

export const setFleetV2 = async (player: SagePlayer) => {
    const fleets = await player.getAllFleetsAsync();
    if (fleets.type !== "Success") return fleets;
    
    // Play with fleets (SageFleet.ts)
    const fleet = await SageFleet.init(fleets.data[0], player);
    return { type: "Success" as const, data: fleet };
}