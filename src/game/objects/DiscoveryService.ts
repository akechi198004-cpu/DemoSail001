import { MapObjectManager } from './MapObjectManager';
import { UnitManager } from '../core/UnitManager';
import { EventBus } from '../events/EventBus';

export class DiscoveryService {
  private objectManager: MapObjectManager;
  private unitManager: UnitManager;
  
  // To avoid spamming, we could track last checked tile per unit
  // For simplicity, we can just run it every update, or periodically

  private timeSinceLastCheck = 0;
  private checkIntervalStr = 500; // checking every 0.5 seconds is enough

  constructor(objectManager: MapObjectManager, unitManager: UnitManager) {
    this.objectManager = objectManager;
    this.unitManager = unitManager;
  }

  public update(delta: number) {
    this.timeSinceLastCheck += delta;
    if (this.timeSinceLastCheck >= this.checkIntervalStr) {
      this.timeSinceLastCheck = 0;
      this.checkDiscoveries();
    }
  }

  private checkDiscoveries() {
    const units = this.unitManager.getUnits();
    const objects = this.objectManager.getObjects();

    for (const unit of units) {
      for (const obj of objects) {
        if (!obj.isDiscovered) {
          // Calculate distance
          const dx = Math.abs(unit.tx - obj.tx);
          const dy = Math.abs(unit.ty - obj.ty);
          const dist = Math.max(dx, dy); // Chebyshev distance is fine for grid

          if (dist <= obj.visibilityRange) {
            // Unlocked!
            const success = this.objectManager.discoverObject(obj.id);
            if (success) {
              const typeLabel = this.getTypeLabel(obj.type);
              EventBus.emit('show-notification', `发现了${typeLabel}：${obj.name}`);
              EventBus.emit('discovered-poi', obj);
            }
          }
        }
      }
    }
  }

  private getTypeLabel(type: string): string {
    switch (type) {
      case 'CITY': return '城市';
      case 'PORT': return '港口';
      case 'VILLAGE': return '村落';
      case 'RUIN': return '遗迹';
      case 'DISCOVERY': return '奇观';
      default: return '地点';
    }
  }
}
