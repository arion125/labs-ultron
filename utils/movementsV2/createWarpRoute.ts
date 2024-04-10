import { Sector } from "@staratlas/sage";
import { BN } from "@staratlas/anchor";
import { SageFleet } from "../../src/SageFleet";

interface Node {
    x: number;
    y: number;
    cost: number; // Costo totale per raggiungere il nodo
    distance: number; // Distanza euclidea dal nodo di arrivo
    f: number; // Stima del costo totale (cost + distance)
    parent?: Node; // Nodo precedente nel percorso
  }

export const createWarpRoute = (fleet: SageFleet, sector1: Sector, sector2: Sector) => {
    /* const start: Node = {x: 10, y: -41, cost: 0, distance: 0, f: 0};
    const goal: Node = {x: 0, y: -39, cost: 0, distance: 0, f: 0};
    const criticalPoints = aStarPathfindingWithRestStops(start, goal, 1.7500);
    console.log("Punti critici della rotta:", criticalPoints.map(node => `(${node.x}, ${node.y})`)); */

    const start: Node = {x: sector1.data.coordinates[0].toNumber(), y: sector1.data.coordinates[1].toNumber(), cost: 0, distance: 0, f: 0};
    const goal: Node = {x: sector2.data.coordinates[0].toNumber(), y: sector2.data.coordinates[1].toNumber(), cost: 0, distance: 0, f: 0};
    const criticalPoints = aStarPathfindingWithRestStops(start, goal, fleet.fleetMovementStats.maxWarpDistance);

    const sectorRoute: Sector[] = [];
    criticalPoints.forEach((node, index) => {
        if (index !== 0) {
            const sector = fleet.getSageGame().getSectorByCoords([new BN(node.x), new BN(node.y)]);
            if (sector.type !== "Success") return;
            sectorRoute.push(sector.data);
        }
    })

    if (criticalPoints.length - 1 !== sectorRoute.length) return { type: "BrokenWarpRoute" as const };

    return { type: "Success" as const, data: sectorRoute };
};
  
// Calcola la distanza euclidea tra due nodi
function euclideanDistance(a: Node, b: Node): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}
  
// Ricostruisce il percorso partendo dal nodo di arrivo
function reconstructPath(endNode: Node): Node[] {
    const path: Node[] = [];
    let currentNode: Node | undefined = endNode;
    while (currentNode) {
        path.unshift(currentNode);
        if (!currentNode.parent) break;
        currentNode = currentNode.parent;
    }
    return path;
}
  
// Determina i punti di sosta lungo il percorso
function identifyRestStops(path: Node[], maxDistancePerSegment: number): Node[] {
    if (path.length === 0) return [];

    const restStops: Node[] = [path[0]]; // Partenza sempre inclusa
    let lastRestStop = path[0];

    for (let i = 1; i < path.length; i++) {
        const segmentDistance = euclideanDistance(path[i], lastRestStop);

        if (segmentDistance > maxDistancePerSegment) {
        // Se la distanza dall'ultima sosta supera il massimo consentito, 
        // aggiungi l'ultimo nodo visitato prima di superare il limite come punto di sosta
        if(i > 1) { // Assicura di non aggiungere il punto di partenza due volte
            restStops.push(path[i - 1]);
            lastRestStop = path[i - 1]; // Aggiorna l'ultima sosta
        }

        // Dopo l'aggiunta del punto di sosta, verifica anche se il punto corrente deve essere una sosta
        // Ciò può accadere se la distanza dal punto di sosta appena aggiunto al punto corrente supera maxDistancePerSegment
        if (euclideanDistance(path[i], lastRestStop) > maxDistancePerSegment) {
            restStops.push(path[i]);
            lastRestStop = path[i]; // Aggiorna l'ultima sosta
        }
        }
    }

    // Assicura che il punto di arrivo sia sempre incluso come ultima sosta se non già presente
    if (!restStops.includes(path[path.length - 1])) {
        restStops.push(path[path.length - 1]);
    }

    return restStops;
}
  
// Implementazione dell'algoritmo A* con la logica per i punti di sosta
function aStarPathfindingWithRestStops(start: Node, goal: Node, maxDistancePerSegment: number): Node[] {
    const openSet: Node[] = [start];
    const closedSet: Node[] = [];
    start.distance = euclideanDistance(start, goal);
    start.f = start.distance;

    while (openSet.length > 0) {
        let current = openSet.reduce((prev, curr) => prev.f < curr.f ? prev : curr);

        if (current.x === goal.x && current.y === goal.y) {
        const path = reconstructPath(current);
        return identifyRestStops(path, maxDistancePerSegment);
        }

        openSet.splice(openSet.indexOf(current), 1);
        closedSet.push(current);

        for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue; // Salta il nodo corrente
            const neighborX = current.x + dx;
            const neighborY = current.y + dy;

            // Verifica se il vicino è già stato esaminato
            if (closedSet.some(node => node.x === neighborX && node.y === neighborY)) continue;

            const tentativeGScore = current.cost + euclideanDistance(current, {x: neighborX, y: neighborY, cost: 0, distance: 0, f: 0});

            let neighbor = openSet.find(node => node.x === neighborX && node.y === neighborY);
            if (!neighbor) {
            neighbor = {x: neighborX, y: neighborY, cost: Infinity, distance: 0, f: 0};
            openSet.push(neighbor);
            }

            if (tentativeGScore >= neighbor.cost) continue; // Questo non è un percorso migliore

            // Questo percorso è il migliore finora. Memorizzalo!
            neighbor.parent = current;
            neighbor.cost = tentativeGScore;
            neighbor.distance = euclideanDistance(neighbor, goal);
            neighbor.f = neighbor.cost + neighbor.distance;
        }
        }
    }

    return []; // Nessun percorso trovato
}