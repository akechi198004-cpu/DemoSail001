import { TerrainGen, TerrainType } from "./TerrainGen";

export class TileResolver {
  /**
   * For Phase 1: We determine specific terrain variant or color depending on neighbors
   * Since we don't have real assets yet, we'll just return a color that MapEngine will tint.
   */
  static getTileTint(type: TerrainType): number {
    switch(type) {
      case TerrainType.DEEP_WATER: return 0x1A4789; // Deep Blue
      case TerrainType.SHALLOW_WATER: return 0x367BBC; // Light Blue
      case TerrainType.COAST: return 0xD5C48A; // Sand color
      case TerrainType.GRASS: return 0x6DAE57; // Grass green
      case TerrainType.FOREST: return 0x3D753D; // Dark green
      case TerrainType.MOUNTAIN: return 0x8C8C8C; // Gray
      case TerrainType.DESERT: return 0xE0C988; // Desert yellow
      case TerrainType.ROAD: return 0xA38C75; // Dirt road color
      case TerrainType.SNOW: return 0xEEEEEE; // Snow white
      default: return 0xFFFFFF;
    }
  }

  static getTileVariant(tx: number, ty: number): string {
    // In the future:
    // const center = TerrainGen.generate(tx, ty).type;
    // const top = TerrainGen.generate(tx, ty - 1).type;
    // const right = ...
    // Determine bitmask...
    return 'default';
  }
}
