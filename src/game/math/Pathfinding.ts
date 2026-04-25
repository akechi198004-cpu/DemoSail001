import { UnitType } from '../entities/UnitTypes';
import { Passability } from '../core/Passability';
import { MapQueryService } from '../core/MapQueryService';

export interface PathResult {
  path: {tx: number, ty: number}[];
  status: 'SUCCESS' | 'TOO_FAR' | 'UNREACHABLE';
}

interface AStarNode {
  tx: number;
  ty: number;
  g: number;
  h: number;
  f: number;
  parent?: AStarNode;
}

export class Pathfinding {
  private static MAX_RADIUS = 120; // 120 tiles radius limit
  private static MAX_EXPANDED_NODES = 3000; // Limit processing to prevent freeze

  static findPath(
    mapQuery: MapQueryService,
    unitType: UnitType,
    startTx: number,
    startTy: number,
    targetTx: number,
    targetTy: number
  ): PathResult {
    // Check basic distance limit
    if (Math.abs(startTx - targetTx) > this.MAX_RADIUS || Math.abs(startTy - targetTy) > this.MAX_RADIUS) {
      return { path: [], status: 'TOO_FAR' };
    }

    // Check if target is even passable
    const targetTerrain = mapQuery.getTerrain(targetTx, targetTy);
    if (!Passability.canUnitEnter(unitType, targetTerrain.type)) {
      return { path: [], status: 'UNREACHABLE' };
    }

    const openList: AStarNode[] = [];
    const closedSet: Set<string> = new Set();
    
    // Quick lookup for open list nodes to update path costs
    const openMap: Map<string, AStarNode> = new Map();

    const startNode = {
      tx: startTx, ty: startTy,
      g: 0,
      h: this.heuristic(startTx, startTy, targetTx, targetTy),
      f: 0
    };
    startNode.f = startNode.g + startNode.h;

    openList.push(startNode);
    openMap.set(`${startTx},${startTy}`, startNode);

    let expandedNodes = 0;

    const neighborsOffsets = [
      { dx: 0, dy: -1 }, { dx: 1, dy: 0 },
      { dx: 0, dy: 1 }, { dx: -1, dy: 0 },
      { dx: 1, dy: -1 }, { dx: 1, dy: 1 }, // Optional: Diagonals
      { dx: -1, dy: 1 }, { dx: -1, dy: -1 }
    ];

    while (openList.length > 0) {
      if (expandedNodes >= this.MAX_EXPANDED_NODES) {
        return { path: [], status: 'TOO_FAR' };
      }

      // Pop node with lowest f
      let currentIndex = 0;
      for (let i = 1; i < openList.length; i++) {
        if (openList[i].f < openList[currentIndex].f) {
          currentIndex = i;
        }
      }

      const current = openList[currentIndex];
      openList.splice(currentIndex, 1);
      openMap.delete(`${current.tx},${current.ty}`);
      closedSet.add(`${current.tx},${current.ty}`);
      expandedNodes++;

      // Reached target?
      if (current.tx === targetTx && current.ty === targetTy) {
        const path: {tx: number, ty: number}[] = [];
        let curr: AStarNode | undefined = current;
        while (curr) {
          path.push({ tx: curr.tx, ty: curr.ty });
          curr = curr.parent;
        }
        path.reverse();
        return { path, status: 'SUCCESS' };
      }

      for (const offset of neighborsOffsets) {
        const nx = current.tx + offset.dx;
        const ny = current.ty + offset.dy;
        const key = `${nx},${ny}`;

        if (closedSet.has(key)) continue;

        // Bounding box check against MAX_RADIUS
        if (Math.abs(startTx - nx) > this.MAX_RADIUS || Math.abs(startTy - ny) > this.MAX_RADIUS) {
          continue; // Pretend it's obstacle
        }

        const neighborTerrain = mapQuery.getTerrain(nx, ny);
        if (!Passability.canUnitEnter(unitType, neighborTerrain.type)) {
          continue;
        }

        // Cost is 1 for straight, approx 1.414 for diagonal
        const cost = (offset.dx !== 0 && offset.dy !== 0) ? 1.414 : 1.0;
        const gScore = current.g + cost;

        const neighborNode = openMap.get(key);
        if (!neighborNode) {
          const hScore = this.heuristic(nx, ny, targetTx, targetTy);
          const newNode: AStarNode = {
            tx: nx, ty: ny,
            g: gScore,
            h: hScore,
            f: gScore + hScore,
            parent: current
          };
          openList.push(newNode);
          openMap.set(key, newNode);
        } else if (gScore < neighborNode.g) {
          // Found a better path to an existing open node
          neighborNode.g = gScore;
          neighborNode.f = neighborNode.g + neighborNode.h;
          neighborNode.parent = current;
        }
      }
    }

    // Explored all possibilities, no path found
    return { path: [], status: 'UNREACHABLE' };
  }

  private static heuristic(x1: number, y1: number, x2: number, y2: number): number {
    // Octile distance heuristic for better diagonal performance
    const dx = Math.abs(x1 - x2);
    const dy = Math.abs(y1 - y2);
    return Math.max(dx, dy) + 0.414 * Math.min(dx, dy);
  }
}
