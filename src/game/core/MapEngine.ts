import * as Phaser from 'phaser';
import { Chunk, CHUNK_SIZE } from './ChunkManager';
import { TerrainGen } from './TerrainGen';
import { TileResolver } from './TileResolver';
import { tileToScreen, TILE_WIDTH, TILE_HEIGHT } from '../math/Coordinates';

export class MapEngine {
  private scene: Phaser.Scene;
  private debugMode: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createTextures();
  }

  setDebugMode(debug: boolean) {
    this.debugMode = debug;
  }

  private createTextures() {
    // Generate a white isometric diamond
    if (!this.scene.textures.exists('iso-tile')) {
      const g = this.scene.add.graphics();
      g.fillStyle(0xffffff, 1.0);
      g.beginPath();
      // Draw standard diamond from top to right to bottom to left
      g.moveTo(TILE_WIDTH / 2, 0);
      g.lineTo(TILE_WIDTH, TILE_HEIGHT / 2);
      g.lineTo(TILE_WIDTH / 2, TILE_HEIGHT);
      g.lineTo(0, TILE_HEIGHT / 2);
      g.closePath();
      g.fillPath();
      
      // Add a small border if needed for debug clarity, but let's stick to fill for now.
      g.generateTexture('iso-tile', TILE_WIDTH, TILE_HEIGHT);
      g.destroy();
    }
    
    // Generate chunk border
    if (!this.scene.textures.exists('chunk-border')) {
      const w = CHUNK_SIZE * TILE_WIDTH;
      const h = CHUNK_SIZE * TILE_HEIGHT;
      // Drawing a full chunk border as isometric is complex because chunk is a 32x32 grid.
      // Easiest is to draw lines manually or skip caching an image for it and draw lines dynamically.
    }
  }

  renderChunk(chunk: Chunk) {
    const startTx = chunk.cx * CHUNK_SIZE;
    const startTy = chunk.cy * CHUNK_SIZE;

    // Optional: add a chunk debug container or graphics
    let debugG: Phaser.GameObjects.Graphics | null = null;
    let debugText: Phaser.GameObjects.Text | null = null;
    
    if (this.debugMode) {
      debugG = this.scene.add.graphics();
      debugG.lineStyle(2, 0xff0000, 0.8);
      
      // Calculate top left, top right, etc in screen coords corresponding to chunk corners
      const t1 = tileToScreen(startTx, startTy);
      const t2 = tileToScreen(startTx + CHUNK_SIZE, startTy);
      const t3 = tileToScreen(startTx + CHUNK_SIZE, startTy + CHUNK_SIZE);
      const t4 = tileToScreen(startTx, startTy + CHUNK_SIZE);
      
      debugG.beginPath();
      debugG.moveTo(t1.x, t1.y + TILE_HEIGHT / 2);
      debugG.lineTo(t2.x, t2.y + TILE_HEIGHT / 2);
      debugG.lineTo(t3.x, t3.y + TILE_HEIGHT / 2);
      debugG.lineTo(t4.x, t4.y + TILE_HEIGHT / 2);
      debugG.closePath();
      debugG.strokePath();
      debugG.setDepth(10000); // Always on top for debug
      
      // Let's add text at the center of the chunk
      const centerScreen = tileToScreen(startTx + CHUNK_SIZE / 2, startTy + CHUNK_SIZE / 2);
      debugText = this.scene.add.text(centerScreen.x, centerScreen.y, `Chunk: ${chunk.cx}, ${chunk.cy}`, {
        color: '#ff0000',
        fontSize: '16px',
        backgroundColor: '#00000088'
      }).setOrigin(0.5).setDepth(10001);
      
      chunk.debugObjects.push(debugG, debugText);
    }

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let y = 0; y < CHUNK_SIZE; y++) {
        const tx = startTx + x;
        const ty = startTy + y;
        
        const terrain = TerrainGen.generate(tx, ty);
        const { x: sx, y: sy } = tileToScreen(tx, ty);
        
        const tint = TileResolver.getTileTint(terrain.type);
        
        // Depth sorting is simple for isometric tiles: tx + ty
        const depth = tx + ty;
        
        const img = this.scene.add.image(sx, sy, 'iso-tile');
        // Because the tileToScreen returns the top point, but standard image sets origin at center.
        // Wait, standard graphics was drawn 0..w, 0..h. Origin defaults to 0.5, 0.5.
        // If we want alignment, we set origin to 0.5, 0 
        img.setOrigin(0.5, 0);
        img.setTint(tint);
        img.setDepth(depth);
        
        chunk.gameObjects.push(img);
      }
    }
  }
}
