import { TerrainGen, TerrainData } from './TerrainGen';

/**
 * Service to cache terrain generation results and provide unified fast access
 * for pathfinding, rendering, and gameplay logic.
 */
export class MapQueryService {
  private baseCache: Map<string, TerrainData> = new Map();

  // Using a single string format 'tx,ty' vs separate maps for speed
  private getCacheKey(tx: number, ty: number): string {
    return `${tx},${ty}`;
  }

  public getTerrain(tx: number, ty: number): TerrainData {
    const key = this.getCacheKey(tx, ty);
    let data = this.baseCache.get(key);
    
    if (!data) {
      data = TerrainGen.generate(tx, ty);
      this.baseCache.set(key, data);
    }
    return data;
  }
  
  public clearCache(): void {
    this.baseCache.clear();
  }
}
