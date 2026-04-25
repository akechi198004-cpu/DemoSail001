import * as Phaser from 'phaser';
import { MapEngine } from '../core/MapEngine';
import { ChunkManager, CHUNK_SIZE } from '../core/ChunkManager';
import { screenToTile, tileToScreen } from '../math/Coordinates';
import { TerrainGen } from '../core/TerrainGen';
import { dispatchMapStats } from '../events/EventBus';

export class MainScene extends Phaser.Scene {
  private mapEngine!: MapEngine;
  private chunkManager!: ChunkManager;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;

  constructor() {
    super({ key: 'MainScene' });
  }

  create() {
    this.mapEngine = new MapEngine(this);
    this.mapEngine.setDebugMode(true); // Requirement for Phase 1
    
    this.chunkManager = new ChunkManager(this, this.mapEngine);
    
    // Set initial camera position in the center of the world
    const initialTx = 2048;
    const initialTy = 2048;
    const { x: sx, y: sy } = tileToScreen(initialTx, initialTy);
    this.cameras.main.scrollX = sx - this.cameras.main.width / 2;
    this.cameras.main.scrollY = sy - this.cameras.main.height / 2;
    
    // input setup
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true;
      this.dragStartX = pointer.x;
      this.dragStartY = pointer.y;
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
    });

    this.input.on('pointerout', () => {
      this.isDragging = false;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const dx = this.dragStartX - pointer.x;
        const dy = this.dragStartY - pointer.y;
        this.cameras.main.scrollX += dx / this.cameras.main.zoom;
        this.cameras.main.scrollY += dy / this.cameras.main.zoom;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
      }
    });

    // Zoom
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any, deltaX: number, deltaY: number, deltaZ: number) => {
      let newZoom = this.cameras.main.zoom - deltaY * 0.001;
      newZoom = Phaser.Math.Clamp(newZoom, 0.2, 2.0);
      this.cameras.main.setZoom(newZoom);
    });
  }

  update(time: number, delta: number) {
    const cam = this.cameras.main;
    this.chunkManager.update(cam.scrollX + cam.width / 2, cam.scrollY + cam.height / 2, cam.width / cam.zoom, cam.height / cam.zoom);

    // Get current hover tile
    const pointer = this.input.activePointer;
    const worldPoint = cam.getWorldPoint(pointer.x, pointer.y);
    const { tx, ty } = screenToTile(worldPoint.x, worldPoint.y);
    const tileX = Math.floor(tx);
    const tileY = Math.floor(ty);
    
    let hoverTerrain = 'OutOfBounds';
    if (tileX >= 0 && tileX < 4096 && tileY >= 0 && tileY < 4096) {
       hoverTerrain = TerrainGen.generate(tileX, tileY).type;
    }

    const chunkCount = this.chunkManager.getLoadedChunkCount();
    const tileCount = chunkCount * CHUNK_SIZE * CHUNK_SIZE;

    dispatchMapStats({
      fps: Math.round(this.game.loop.actualFps),
      camX: Math.round(cam.scrollX + cam.width / 2),
      camY: Math.round(cam.scrollY + cam.height / 2),
      tileX,
      tileY,
      chunkCount,
      tileCount,
      hoverTerrain
    });
  }
}
