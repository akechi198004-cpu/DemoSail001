import * as Phaser from 'phaser';
import { UnitType } from './UnitTypes';
import { tileToScreen, screenToTile } from '../math/Coordinates';

export class Unit {
  public id: string;
  public type: UnitType;
  public tx: number;
  public ty: number;
  public state: 'IDLE' | 'MOVING' = 'IDLE';
  public path: {tx: number, ty: number}[] = [];
  
  public visualPosition: { x: number, y: number };
  private scene: Phaser.Scene;
  public gameObject!: Phaser.GameObjects.Graphics; // using simple shapes for now

  // Interpolation logic
  private moveSpeedParams = {
    [UnitType.HUMAN]: 150, // units of speed per second
    [UnitType.SHIP]: 250
  };

  private targetTx: number | null = null;
  private targetTy: number | null = null;

  constructor(scene: Phaser.Scene, id: string, type: UnitType, tx: number, ty: number) {
    this.scene = scene;
    this.id = id;
    this.type = type;
    this.tx = tx;
    this.ty = ty;

    const { x, y } = tileToScreen(tx, ty);
    this.visualPosition = { x, y };
    
    this.createGraphic();
  }

  private createGraphic() {
    this.gameObject = this.scene.add.graphics();
    // Start drawing
    this.updateGraphic();
  }

  private updateGraphic() {
    this.gameObject.clear();
    
    // Differentiate Ship and Human
    if (this.type === UnitType.SHIP) {
      // Ship - draw a little brown boat
      this.gameObject.fillStyle(0x8B4513, 1); // SaddleBrown
      // Simple diamond/boat shape
      this.gameObject.beginPath();
      this.gameObject.moveTo(0, -10);
      this.gameObject.lineTo(15, 0);
      this.gameObject.lineTo(0, 10);
      this.gameObject.lineTo(-15, 0);
      this.gameObject.closePath();
      this.gameObject.fillPath();
      
      // Sail
      this.gameObject.fillStyle(0xFFFFFF, 1);
      this.gameObject.beginPath();
      this.gameObject.moveTo(0, -5);
      this.gameObject.lineTo(10, 0);
      this.gameObject.lineTo(0, -25);
      this.gameObject.closePath();
      this.gameObject.fillPath();

    } else {
      // Human - draw a small green/grey character
      this.gameObject.fillStyle(0x228B22, 1); // ForestGreen
      this.gameObject.fillCircle(0, -10, 8); // Body
      this.gameObject.fillStyle(0xFFD700, 1); // Goldish head
      this.gameObject.fillCircle(0, -22, 5); // Head
    }
    
    this.gameObject.setPosition(this.visualPosition.x, this.visualPosition.y);
  }

  public setPath(newPath: {tx: number, ty: number}[]) {
    // If the path includes the current node as the first element, shift it out
    if (newPath.length > 0 && newPath[0].tx === this.tx && newPath[0].ty === this.ty) {
      newPath.shift();
    }
    this.path = newPath;
    if (this.path.length > 0) {
      this.state = 'MOVING';
      this.targetTx = this.path[0].tx;
      this.targetTy = this.path[0].ty;
    } else {
      this.state = 'IDLE';
      this.targetTx = null;
      this.targetTy = null;
    }
  }

  public update(deltaStr: number) {
    const delta = deltaStr / 1000; // to seconds

    if (this.state === 'MOVING' && this.targetTx !== null && this.targetTy !== null) {
      const { x: targetScreenX, y: targetScreenY } = tileToScreen(this.targetTx, this.targetTy);
      
      const dx = targetScreenX - this.visualPosition.x;
      const dy = targetScreenY - this.visualPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const speed = this.moveSpeedParams[this.type];
      const moveDist = speed * delta;

      if (distance <= moveDist) {
        // Reached the next node
        this.visualPosition.x = targetScreenX;
        this.visualPosition.y = targetScreenY;
        this.tx = this.targetTx;
        this.ty = this.targetTy;
        
        // Pop node
        this.path.shift();
        
        if (this.path.length > 0) {
          this.targetTx = this.path[0].tx;
          this.targetTy = this.path[0].ty;
        } else {
          this.targetTx = null;
          this.targetTy = null;
          this.state = 'IDLE';
        }
      } else {
        // Move towards node
        const dirX = dx / distance;
        const dirY = dy / distance;
        this.visualPosition.x += dirX * moveDist;
        this.visualPosition.y += dirY * moveDist;
        
        // Calculate an interpolated approximate continuous ty/tx for depth sorting
        const curTile = screenToTile(this.visualPosition.x, this.visualPosition.y);
        this.tx = curTile.tx;
        this.ty = curTile.ty;
      }
    }

    this.gameObject.setPosition(this.visualPosition.x, this.visualPosition.y);
    
    // Dynamic Depth Sorting
    // In isometric standard, depth = visual Y works very well when origins are bottom-centered
    // Or we can use tileX + tileY with some fractional parts
    // Let's use visualPosition.y for absolute global sorting across layers
    this.gameObject.setDepth(this.visualPosition.y);
  }

  public destroy() {
    if (this.gameObject) {
      this.gameObject.destroy();
    }
  }
}
