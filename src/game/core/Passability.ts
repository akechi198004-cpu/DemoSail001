import { TerrainType } from './TerrainGen';
import { UnitType } from '../entities/UnitTypes';

export class Passability {
  static isWaterTerrain(type: TerrainType): boolean {
    return type === TerrainType.DEEP_WATER || type === TerrainType.SHALLOW_WATER;
  }

  static isLandTerrain(type: TerrainType): boolean {
    return !this.isWaterTerrain(type);
  }

  static canUnitEnter(unitType: UnitType, terrainType: TerrainType): boolean {
    if (unitType === UnitType.SHIP) {
      // Ships can only traverse water
      return this.isWaterTerrain(terrainType);
    } else if (unitType === UnitType.HUMAN) {
      // Humans can traverse land, except maybe deep mountains (we'll allow mountains for now to avoid totally blocked areas, or make them impassable if desired. Let's make standard mountains impassable for humans to add routing flavor, unless it's too restrictive).
      // Let's make mountains passable but very slow (in a future cost system). For now, walkable.
      return this.isLandTerrain(terrainType) && terrainType !== TerrainType.MOUNTAIN;
    }
    return false;
  }
}
