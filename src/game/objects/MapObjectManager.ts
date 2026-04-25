import { MapObject, MapObjectType } from './MapObjectTypes';
import { INITIAL_MAP_OBJECTS, LOCATION_NAMES } from '../data/MapResources';
import { MapQueryService } from '../core/MapQueryService';
import { TerrainType } from '../core/TerrainGen';

export class MapObjectManager {
  private objects: Map<string, MapObject> = new Map();
  private mapQuery: MapQueryService;

  constructor(mapQuery: MapQueryService) {
    this.mapQuery = mapQuery;
    this.initObjects();
  }

  private initObjects() {
    const savedData = localStorage.getItem('discovered_pois');
    let discoveredIds = new Set<string>();
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (Array.isArray(parsed)) {
          discoveredIds = new Set(parsed);
        }
      } catch(e) {
        console.warn('Failed to parse discovered_pois', e);
      }
    }

    // Load original positions or saved positions if we persist them,
    // but for now we dynamically find land on every fresh load to make sure they are correct.
    // Add procedural generation for nearby chunks
    this.generateProceduralObjects();

    for (const obj of INITIAL_MAP_OBJECTS) {
      const cloned = { ...obj };
      if (discoveredIds.has(cloned.id)) {
        cloned.isDiscovered = true;
      }
      this.repositionToValidTerrain(cloned);
      this.objects.set(cloned.id, cloned);
    }

    // Now process the generated ones
    for (const obj of this.generatedObjects) {
       if (discoveredIds.has(obj.id)) {
           obj.isDiscovered = true;
       }
       // We already placed them on valid terrain during generation to avoid slow loading
       this.objects.set(obj.id, obj);
    }
  }

  private generatedObjects: MapObject[] = [];

  private generateProceduralObjects() {
      const CHUNK_SIZE = 32;
      const centerCx = Math.floor(2048 / CHUNK_SIZE);
      const centerCy = Math.floor(2048 / CHUNK_SIZE);
      const range = 2; // 5x5 = 25 chunks, but we will make it sparse

      // Simple seeded random
      let seed = 12345;
      const random = () => {
          seed = (seed * 9301 + 49297) % 233280;
          return seed / 233280;
      };

      let chunksProcessed = 0;

      const availableNames = {
          PORT: [...LOCATION_NAMES.PORT],
          CITY: [...LOCATION_NAMES.CITY],
          RUIN: [...LOCATION_NAMES.RUIN],
          VILLAGE: [...LOCATION_NAMES.VILLAGE],
      };

      const getName = (type: MapObjectType, fallbackLabel: string) => {
          const list = availableNames[type as keyof typeof availableNames];
          if (list && list.length > 0) {
              const idx = Math.floor(random() * list.length);
              return list.splice(idx, 1)[0];
          }
          return '未知' + fallbackLabel;
      };

      for (let cx = centerCx - range; cx <= centerCx + range; cx++) {
          for (let cy = centerCy - range; cy <= centerCy + range; cy++) {
              // Skip some chunks to make it even sparser (roughly 12-15 chunks)
              if (random() > 0.5) continue;
              
              const startTx = cx * CHUNK_SIZE;
              const startTy = cy * CHUNK_SIZE;

              // Number of objects, drastically reduced
              const ports = random() > 0.4 ? 1 : 0; // ~60% chance for 1 port
              const cities = random() > 0.3 ? 1 : 0; // ~70% chance for 1 city
              const ruins = random() > 0.7 ? 1 : 0; // ~30% chance for 1 ruin
              const villages = random() > 0.5 ? 1 : 0; // ~50% chance for 1 village

              this.spawnInChunk(cx, cy, startTx, startTy, ports, 'PORT', () => getName('PORT', '港口'), '依海而建的繁荣港口。', 8, random);
              this.spawnInChunk(cx, cy, startTx, startTy, cities, 'CITY', () => getName('CITY', '城市'), '人口密集的城镇。', 10, random);
              this.spawnInChunk(cx, cy, startTx, startTy, ruins, 'RUIN', () => getName('RUIN', '遗迹'), '前人留下的残垣断壁。', 5, random);
              this.spawnInChunk(cx, cy, startTx, startTy, villages, 'VILLAGE', () => getName('VILLAGE', '村落'), '与世无争的宁静村落。', 4, random);
              
              chunksProcessed++;
              if (chunksProcessed >= 12) return; // Stop after 12 chunks
          }
      }
  }

  private spawnInChunk(cx: number, cy: number, startTx: number, startTy: number, count: number, type: MapObjectType, getNameFn: () => string, desc: string, visRange: number, random: () => number) {
      for (let i = 0; i < count; i++) {
        const id = `proc_${type}_${cx}_${cy}_${i}`;
        
        // Random position within chunk
        let tx = startTx + Math.floor(random() * 32);
        let ty = startTy + Math.floor(random() * 32);

        const obj: MapObject = {
            id,
            name: getNameFn(),
            type,
            tx,
            ty,
            isDiscovered: false,
            visibilityRange: visRange,
            interactionRange: 1,
            description: desc
        };

        // Fast local search for valid terrain
        const valid = this.findValidTerrainForTypeLocal(obj, 15);
        if (valid) {
            this.generatedObjects.push(obj);
        }
      }
  }

  private findValidTerrainForTypeLocal(obj: MapObject, maxRadius: number): boolean {
    let x = 0, y = 0, dx = 0, dy = -1;
    for (let i = 0; i < Math.pow(maxRadius * 2, 2); i++) {
        if (-maxRadius / 2 < x && x <= maxRadius / 2 && -maxRadius / 2 < y && y <= maxRadius / 2) {
            const checkTx = obj.tx + x;
            const checkTy = obj.ty + y;
            const terrain = this.mapQuery.getTerrain(checkTx, checkTy);
            
            const isLand = terrain.type !== TerrainType.DEEP_WATER && terrain.type !== TerrainType.SHALLOW_WATER && terrain.type !== TerrainType.MOUNTAIN;

            if (isLand) {
                if (obj.type === 'PORT') {
                    // Check neighbors for water
                    let hasWaterNeighbor = false;
                    for (let nx = -1; nx <= 1; nx++) {
                        for (let ny = -1; ny <= 1; ny++) {
                            if (nx === 0 && ny === 0) continue;
                            const neighbor = this.mapQuery.getTerrain(checkTx + nx, checkTy + ny);
                            if (neighbor.type === TerrainType.DEEP_WATER || neighbor.type === TerrainType.SHALLOW_WATER) {
                                hasWaterNeighbor = true;
                                break;
                            }
                        }
                    }
                    if (hasWaterNeighbor) {
                        obj.tx = checkTx;
                        obj.ty = checkTy;
                        return true;
                    }
                } else {
                    obj.tx = checkTx;
                    obj.ty = checkTy;
                    return true;
                }
            }
        }
        if (x === y || (x < 0 && x === -y) || (x > 0 && x === 1 - y)) {
            const temp = dx;
            dx = -dy;
            dy = temp;
        }
        x += dx;
        y += dy;
    }
    return false;
  }

  private repositionToValidTerrain(obj: MapObject) {
    const maxRadius = 100;
    
    let x = 0, y = 0, dx = 0, dy = -1;
    for (let i = 0; i < Math.pow(maxRadius * 2, 2); i++) {
        if (-maxRadius / 2 < x && x <= maxRadius / 2 && -maxRadius / 2 < y && y <= maxRadius / 2) {
            const checkTx = obj.tx + x;
            const checkTy = obj.ty + y;
            const terrain = this.mapQuery.getTerrain(checkTx, checkTy);
            
            // Basic land check
            const isLand = terrain.type !== TerrainType.DEEP_WATER && terrain.type !== TerrainType.SHALLOW_WATER && terrain.type !== TerrainType.MOUNTAIN;

            if (isLand) {
                if (obj.type === 'PORT') {
                    // Port must be adjacent to water
                    let hasWaterNeighbor = false;
                    for (let nx = -1; nx <= 1; nx++) {
                        for (let ny = -1; ny <= 1; ny++) {
                            if (nx === 0 && ny === 0) continue;
                            const neighbor = this.mapQuery.getTerrain(checkTx + nx, checkTy + ny);
                            if (neighbor.type === TerrainType.DEEP_WATER || neighbor.type === TerrainType.SHALLOW_WATER) {
                                hasWaterNeighbor = true;
                                break;
                            }
                        }
                        if (hasWaterNeighbor) break;
                    }
                    if (hasWaterNeighbor) {
                        obj.tx = checkTx;
                        obj.ty = checkTy;
                        return;
                    }
                } else {
                    // Non-port just needs valid land
                    obj.tx = checkTx;
                    obj.ty = checkTy;
                    return;
                }
            }
        }
        if (x === y || (x < 0 && x === -y) || (x > 0 && x === 1 - y)) {
            const temp = dx;
            dx = -dy;
            dy = temp;
        }
        x += dx;
        y += dy;
    }
    console.warn(`Could not find a valid placement for ${obj.name} near ${obj.tx}, ${obj.ty}`);
  }

  public getObjects(): MapObject[] {
    return Array.from(this.objects.values());
  }

  public getObjectById(id: string): MapObject | undefined {
    return this.objects.get(id);
  }

  public discoverObject(id: string): boolean {
    const obj = this.objects.get(id);
    if (obj && !obj.isDiscovered) {
      obj.isDiscovered = true;
      this.saveDiscoveredState();
      return true;
    }
    return false;
  }

  private saveDiscoveredState() {
    const discoveredIds = Array.from(this.objects.values())
      .filter(o => o.isDiscovered)
      .map(o => o.id);
    localStorage.setItem('discovered_pois', JSON.stringify(discoveredIds));
  }
}

