import * as Phaser from 'phaser';

export const CHUNK_SIZE = 32;

export interface Chunk {
  cx: number;
  cy: number;
  isLoaded: boolean;
  gameObjects: Phaser.GameObjects.GameObject[];
  debugObjects: Phaser.GameObjects.GameObject[];
}

import { screenToTile, TILE_WIDTH, TILE_HEIGHT } from '../math/Coordinates';
import { MapEngine } from './MapEngine';

export class ChunkManager {
  private chunks: Map<string, Chunk> = new Map();
  private mapEngine: MapEngine;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, mapEngine: MapEngine) {
    this.scene = scene;
    this.mapEngine = mapEngine;
  }

  update(cameraX: number, cameraY: number, viewWidth: number, viewHeight: number) {
    try {
      const centerTile = screenToTile(cameraX, cameraY);
      
      const radiusInChunks = 1; // 3x3 chunks = 9 chunks max, safe performance

      const centerCx = Math.floor(centerTile.tx / CHUNK_SIZE);
      const centerCy = Math.floor(centerTile.ty / CHUNK_SIZE);

      const minCx = Math.max(0, centerCx - radiusInChunks);
      const maxCx = Math.min(Math.floor(4096 / CHUNK_SIZE) - 1, centerCx + radiusInChunks);
      const minCy = Math.max(0, centerCy - radiusInChunks);
      const maxCy = Math.min(Math.floor(4096 / CHUNK_SIZE) - 1, centerCy + radiusInChunks);

      const visibleChunkKeys = new Set<string>();

      for (let cx = minCx; cx <= maxCx; cx++) {
        for (let cy = minCy; cy <= maxCy; cy++) {
          const key = `${cx},${cy}`;
          visibleChunkKeys.add(key);
          
          if (!this.chunks.has(key)) {
            this.loadChunk(cx, cy);
          }
        }
      }

      // Unload chunks that are out of bounds
      for (const [key, chunk] of this.chunks.entries()) {
        if (!visibleChunkKeys.has(key)) {
          this.unloadChunk(key, chunk);
        }
      }
    } catch (e) {
      console.error("Error in ChunkManager.update:", e);
    }
  }

  private loadChunk(cx: number, cy: number) {
    const chunk: Chunk = {
      cx,
      cy,
      isLoaded: true,
      gameObjects: [],
      debugObjects: []
    };

    // The MapEngine will generate the specific tile objects and add them to the scene
    this.mapEngine.renderChunk(chunk);
    
    this.chunks.set(`${cx},${cy}`, chunk);
  }

  private unloadChunk(key: string, chunk: Chunk) {
    chunk.gameObjects.forEach(obj => obj.destroy());
    chunk.debugObjects.forEach(obj => obj.destroy());
    this.chunks.delete(key);
  }

  getLoadedChunkCount(): number {
    return this.chunks.size;
  }
}
