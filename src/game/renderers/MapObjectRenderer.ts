import * as Phaser from 'phaser';
import { MapObjectManager } from '../objects/MapObjectManager';
import { tileToScreen } from '../math/Coordinates';
import { MapObject } from '../objects/MapObjectTypes';

export class MapObjectRenderer {
  private scene: Phaser.Scene;
  private objectManager: MapObjectManager;
  
  private renderMap: Map<string, { container: Phaser.GameObjects.Container, wasDiscovered: boolean | null }> = new Map();

  constructor(scene: Phaser.Scene, objectManager: MapObjectManager) {
    this.scene = scene;
    this.objectManager = objectManager;
  }

  public update() {
    const objects = this.objectManager.getObjects();

    for (const obj of objects) {
      this.syncObjectRender(obj);
    }
  }

  private syncObjectRender(obj: MapObject) {
    let renderNode = this.renderMap.get(obj.id);

    if (!renderNode) {
      const nodeContainer = this.scene.add.container(0, 0);
      
      // Calculate depth based on object's static position
      const { x, y } = tileToScreen(obj.tx, obj.ty);
      nodeContainer.setPosition(x, y);
      nodeContainer.setDepth(y); // Global iso Z-sorting!

      // Add a hit area for clicking
      nodeContainer.setSize(40, 40);
      nodeContainer.setInteractive(new Phaser.Geom.Rectangle(-20, -20, 40, 40), Phaser.Geom.Rectangle.Contains);
      
      nodeContainer.on('pointerup', () => {
        import('../events/EventBus').then(({ EventBus }) => {
          EventBus.emit('poi-clicked', obj);
          if (obj.isDiscovered) {
             EventBus.emit('open-location-dialog', obj);
          } else {
             EventBus.emit('show-notification', '距离太远，无法看清全貌。请派遣舰队靠近探索。');
          }
        });
      });

      renderNode = { container: nodeContainer, wasDiscovered: null };
      this.renderMap.set(obj.id, renderNode);
    }

    if (renderNode.wasDiscovered !== obj.isDiscovered) {
      renderNode.wasDiscovered = obj.isDiscovered;
      this.redrawVisuals(renderNode.container, obj);
    }
  }

  private redrawVisuals(nodeContainer: Phaser.GameObjects.Container, obj: MapObject) {
    nodeContainer.removeAll(true);
    
    const graphics = this.scene.add.graphics();
    nodeContainer.add(graphics);

    if (!obj.isDiscovered) {
      // Draw Undiscovered thicker and bigger
      graphics.fillStyle(0x333333, 0.9);
      graphics.fillCircle(0, -15, 15);
      graphics.lineStyle(3, 0xffbb00, 1);
      graphics.strokeCircle(0, -15, 15);

      const qText = this.scene.add.text(0, -15, '?', {
        fontFamily: 'monospace',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffbb00'
      }).setOrigin(0.5);
      nodeContainer.add(qText);

    } else {
      // Draw Discovered
      const { color, shape, emoji } = this.getStyleForType(obj.type);
      
      graphics.fillStyle(color, 1);
      graphics.lineStyle(2, 0xffffff, 1);

      if (shape === 'rect') {
        graphics.fillRect(-15, -25, 30, 25);
        graphics.strokeRect(-15, -25, 30, 25);
      } else if (shape === 'triangle') {
        graphics.beginPath();
        graphics.moveTo(0, -30);
        graphics.lineTo(18, -5);
        graphics.lineTo(-18, -5);
        graphics.closePath();
        graphics.fillPath();
        graphics.strokePath();
      } else {
        graphics.fillCircle(0, -15, 15);
        graphics.strokeCircle(0, -15, 15);
      }

      // Add Emoji
      const emojiText = this.scene.add.text(0, -15, emoji, {
        fontSize: '16px'
      }).setOrigin(0.5);
      nodeContainer.add(emojiText);

      const nameText = this.scene.add.text(0, -40, obj.name, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
        backgroundColor: '#000000aa',
        padding: { x: 3, y: 2 }
      }).setOrigin(0.5);
      nodeContainer.add(nameText);
    }
  }

  private getStyleForType(type: string): { color: number, shape: string, emoji: string } {
    switch (type) {
      case 'CITY': return { color: 0x992222, shape: 'rect', emoji: '🏰' }; 
      case 'PORT': return { color: 0x2222aa, shape: 'rect', emoji: '⚓' }; 
      case 'VILLAGE': return { color: 0x6e4e2a, shape: 'circle', emoji: '🛖' }; 
      case 'RUIN': return { color: 0x555555, shape: 'triangle', emoji: '🗿' };
      case 'DISCOVERY': return { color: 0xba9d00, shape: 'triangle', emoji: '✨' };
      default: return { color: 0xffffff, shape: 'circle', emoji: '📍' };
    }
  }
}
