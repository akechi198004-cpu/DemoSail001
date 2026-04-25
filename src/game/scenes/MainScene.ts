import * as Phaser from 'phaser';
import { MapEngine } from '../core/MapEngine';
import { ChunkManager, CHUNK_SIZE } from '../core/ChunkManager';
import { screenToTile, tileToScreen } from '../math/Coordinates';
import { dispatchMapStats } from '../events/EventBus';
import { MapQueryService } from '../core/MapQueryService';
import { UnitManager } from '../core/UnitManager';
import { UnitType } from '../entities/UnitTypes';
import { MapObjectManager } from '../objects/MapObjectManager';
import { MapObjectRenderer } from '../renderers/MapObjectRenderer';
import { DiscoveryService } from '../objects/DiscoveryService';

export class MainScene extends Phaser.Scene {
  private mapEngine!: MapEngine;
  private chunkManager!: ChunkManager;
  private mapQuery!: MapQueryService;
  private unitManager!: UnitManager;
  
  private objectManager!: MapObjectManager;
  private objectRenderer!: MapObjectRenderer;
  private discoveryService!: DiscoveryService;

  private isPointerDown = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private hasDragged = false;

  private isUiModalOpen = false;

  constructor() {
    super({ key: 'MainScene' });
  }

  create() {
    this.mapEngine = new MapEngine(this);
    this.mapEngine.setDebugMode(false); // Disable visual layer debug text for nicer look
    
    this.mapQuery = new MapQueryService();
    this.unitManager = new UnitManager(this, this.mapQuery);
    this.chunkManager = new ChunkManager(this, this.mapEngine);
    
    this.objectManager = new MapObjectManager(this.mapQuery);
    this.objectRenderer = new MapObjectRenderer(this, this.objectManager);
    this.discoveryService = new DiscoveryService(this.objectManager, this.unitManager);

    import('../events/EventBus').then(({ EventBus }) => {
      EventBus.on('open-location-dialog', () => { this.isUiModalOpen = true; });
      EventBus.on('close-location-dialog', () => { setTimeout(() => { this.isUiModalOpen = false; }, 100); }); // delay to prevent immediate click through
    });

    // Set initial camera position in the center of the world
    const initialTx = 2048;
    const initialTy = 2048;
    const { x: sx, y: sy } = tileToScreen(initialTx, initialTy);
    this.cameras.main.scrollX = sx - this.cameras.main.width / 2;
    this.cameras.main.scrollY = sy - this.cameras.main.height / 2;
    
    // Spawn units
    // 1 Human and 1 Ship near the center
    this.unitManager.spawnUnit('explorer-1', UnitType.HUMAN, initialTx, initialTy);
    // Since spawn logic finds nearest water/land depending on type:
    this.unitManager.spawnUnit('ship-1', UnitType.SHIP, initialTx, initialTy);

    // Initial render of objects
    this.objectRenderer.update();

    // input setup
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isUiModalOpen) return;
      this.isPointerDown = true;
      this.dragStartX = pointer.x;
      this.dragStartY = pointer.y;
      this.hasDragged = false;
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
      this.isPointerDown = false;
      
      if (this.isUiModalOpen) return;

      const dx = pointer.x - this.dragStartX;
      const dy = pointer.y - this.dragStartY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= 5) { // Threshold for click vs drag
        if (currentlyOver && currentlyOver.length > 0) {
          // It was caught by a MapObject hit area
          return;
        }

        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const { tx, ty } = screenToTile(worldPoint.x, worldPoint.y);
        
        // Handle Map Click
        this.handleMapClick(tx, ty);
      }
    });

    this.input.on('pointerout', () => {
      this.isPointerDown = false;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isUiModalOpen) return;
      if (this.isPointerDown) {
        const dx = pointer.x - this.dragStartX;
        const dy = pointer.y - this.dragStartY;
        
        // If we move enough, it counts as dragging
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          this.hasDragged = true;
        }

        if (this.hasDragged) {
          const moveDx = pointer.x - pointer.prevPosition.x;
          const moveDy = pointer.y - pointer.prevPosition.y;
          this.cameras.main.scrollX -= moveDx / this.cameras.main.zoom;
          this.cameras.main.scrollY -= moveDy / this.cameras.main.zoom;
        }
      }
    });

    // Zoom
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any, deltaX: number, deltaY: number, deltaZ: number) => {
      if (this.isUiModalOpen) return;
      let newZoom = this.cameras.main.zoom - deltaY * 0.001;
      newZoom = Phaser.Math.Clamp(newZoom, 0.2, 2.0);
      this.cameras.main.setZoom(newZoom);
    });

    // Reset Camera with space bar
    this.input.keyboard?.on('keydown-SPACE', () => {
      if (this.unitManager.selectedUnit) {
        const { x, y } = this.unitManager.selectedUnit.visualPosition;
        this.cameras.main.scrollX = x - this.cameras.main.width / 2;
        this.cameras.main.scrollY = y - this.cameras.main.height / 2;
      }
    });
  }

  private handleMapClick(tx: number, ty: number) {
    // 1. Try to select a unit
    if (this.unitManager.trySelectUnitAt(tx, ty)) {
      return; 
    }
    
    // 2. If a unit is already selected, try to move it
    if (this.unitManager.selectedUnit) {
      this.unitManager.orderSelectedUnitTo(tx, ty);
    }
  }

  update(time: number, delta: number) {
    const cam = this.cameras.main;
    this.chunkManager.update(cam.scrollX + cam.width / 2, cam.scrollY + cam.height / 2, cam.width / cam.zoom, cam.height / cam.zoom);
    this.unitManager.update(delta);
    
    this.discoveryService.update(delta);
    this.objectRenderer.update(); // could be optimized, but fine for prototype

    // Get current hover tile
    const pointer = this.input.activePointer;
    const worldPoint = cam.getWorldPoint(pointer.x, pointer.y);
    const { tx, ty } = screenToTile(worldPoint.x, worldPoint.y);
    const tileX = Math.floor(tx);
    const tileY = Math.floor(ty);
    
    let hoverTerrain = 'OutOfBounds';
    if (tileX >= 0 && tileX < 4096 && tileY >= 0 && tileY < 4096) {
       hoverTerrain = this.mapQuery.getTerrain(tileX, tileY).type;
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

