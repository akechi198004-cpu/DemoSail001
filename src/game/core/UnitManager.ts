import * as Phaser from 'phaser';
import { Unit } from '../entities/Unit';
import { UnitType } from '../entities/UnitTypes';
import { MapQueryService } from '../core/MapQueryService';
import { Passability } from '../core/Passability';
import { Pathfinding } from '../math/Pathfinding';
import { EventBus } from '../events/EventBus';
import { tileToScreen } from '../math/Coordinates';

export class UnitManager {
  private scene: Phaser.Scene;
  private mapQuery: MapQueryService;
  private units: Unit[] = [];
  public selectedUnit: Unit | null = null;
  
  private selectorGraphics!: Phaser.GameObjects.Graphics;
  private pathGraphics!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, mapQuery: MapQueryService) {
    this.scene = scene;
    this.mapQuery = mapQuery;
    
    // UI Graphics for selection overlay
    this.selectorGraphics = this.scene.add.graphics();
    // High layer
    this.selectorGraphics.setDepth(9999999);
    
    // Path renderer graphic overlay
    this.pathGraphics = this.scene.add.graphics();
    this.pathGraphics.setDepth(9999998); // just below selector
  }

  // Find nearest passable tile using simple BFS up to a max radius
  public findNearestPassableTile(unitType: UnitType, tX: number, tY: number): {tx: number, ty: number} | null {
    const startTerrain = this.mapQuery.getTerrain(tX, tY);
    if (Passability.canUnitEnter(unitType, startTerrain.type)) {
      return { tx: tX, ty: tY };
    }

    const queue: {tx: number, ty: number, dist: number}[] = [{tx: tX, ty: tY, dist: 0}];
    const visited = new Set<string>();
    visited.add(`${tX},${tY}`);

    const maxSearchDist = 20;

    const dirs = [ {dx: 0, dy: -1}, {dx: 1, dy: 0}, {dx: 0, dy: 1}, {dx: -1, dy: 0} ];

    while(queue.length > 0) {
      const current = queue.shift()!;
      if (current.dist > maxSearchDist) break;

      for (const d of dirs) {
        const nx = current.tx + d.dx;
        const ny = current.ty + d.dy;
        const key = `${nx},${ny}`;
        if (!visited.has(key)) {
          visited.add(key);
          const nTerrain = this.mapQuery.getTerrain(nx, ny);
          if (Passability.canUnitEnter(unitType, nTerrain.type)) {
            return { tx: nx, ty: ny };
          }
          queue.push({ tx: nx, ty: ny, dist: current.dist + 1 });
        }
      }
    }
    return null;
  }

  public spawnUnit(id: string, type: UnitType, preferredTx: number, preferredTy: number) {
    const pos = this.findNearestPassableTile(type, preferredTx, preferredTy);
    if (!pos) {
      console.warn(`Could not spawn unit ${id} near ${preferredTx}, ${preferredTy}`);
      return;
    }
    const unit = new Unit(this.scene, id, type, pos.tx, pos.ty);
    this.units.push(unit);
    
    // Auto-select first spawned unit if none selected
    if (!this.selectedUnit) {
      this.selectUnit(unit);
    }
  }

  public getUnits() {
    return this.units;
  }

  public selectUnit(unit: Unit | null) {
    this.selectedUnit = unit;
    if (unit) {
      EventBus.emit('unit-selected', { id: unit.id, type: unit.type });
    } else {
      EventBus.emit('unit-deselected');
    }
    this.updateSelector();
    this.updatePathRendering();
  }

  public trySelectUnitAt(tx: number, ty: number): boolean {
    // Basic hit test: check if there's a unit within 1 tile of the click.
    // Since iso clicks are math based, we just check tx,ty bounds.
    for (const unit of this.units) {
      // Very simple bounding box check
      if (Math.abs(unit.tx - tx) <= 1 && Math.abs(unit.ty - ty) <= 1) {
        this.selectUnit(unit);
        return true;
      }
    }
    return false;
  }

  public orderSelectedUnitTo(tx: number, ty: number) {
    if (!this.selectedUnit) return;

    tx = Math.floor(tx);
    ty = Math.floor(ty);

    const result = Pathfinding.findPath(this.mapQuery, this.selectedUnit.type, Math.floor(this.selectedUnit.tx), Math.floor(this.selectedUnit.ty), tx, ty);
    
    if (result.status === 'TOO_FAR') {
      EventBus.emit('show-notification', '目标太远，请选择附近地点');
      this.selectedUnit.setPath([]);
    } else if (result.status === 'UNREACHABLE') {
      EventBus.emit('show-notification', '无法到达目标地点');
      this.selectedUnit.setPath([]);
    } else if (result.status === 'SUCCESS' && result.path.length > 0) {
      this.selectedUnit.setPath(result.path);
    }
    
    this.updatePathRendering();
  }

  private updateSelector() {
    this.selectorGraphics.clear();
    if (this.selectedUnit) {
      this.selectorGraphics.lineStyle(2, 0xFFFF00, 1);
      
      const { x, y } = this.selectedUnit.visualPosition;
      
      // Draw a yellow ellipse around the base of the unit
      this.selectorGraphics.strokeEllipse(x, y, 32, 16);
      
      // Keep it attached to the unit's position dynamically
      // So we update this inside update loop as well.
    }
  }

  private updatePathRendering() {
    this.pathGraphics.clear();
    
    if (this.selectedUnit && this.selectedUnit.path.length > 0) {
      this.pathGraphics.lineStyle(3, 0xffffff, 0.5);
      
      this.pathGraphics.beginPath();
      
      // First point is the unit's local pos
      const { x, y } = this.selectedUnit.visualPosition;
      this.pathGraphics.moveTo(x, y);

      for (const p of this.selectedUnit.path) {
        const sp = tileToScreen(p.tx, p.ty);
        this.pathGraphics.lineTo(sp.x, sp.y);
      }
      this.pathGraphics.strokePath();
    }
  }

  public update(delta: number) {
    for (const unit of this.units) {
      unit.update(delta);
    }
    
    if (this.selectedUnit) {
      this.updateSelector();
      // Only keep rendering path if the unit is moving
      if (this.selectedUnit.state === 'MOVING') {
        this.updatePathRendering();
      } else {
        this.pathGraphics.clear();
      }
    }
  }
}
