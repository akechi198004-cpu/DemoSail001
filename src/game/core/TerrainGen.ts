import { createNoise2D } from 'simplex-noise';

export enum TerrainType {
  DEEP_WATER = 'deepWater',
  SHALLOW_WATER = 'shallowWater',
  COAST = 'coast',
  GRASS = 'grass',
  FOREST = 'forest',
  MOUNTAIN = 'mountain',
  DESERT = 'desert',
  ROAD = 'road', // Phase 1 specifies road as a terrain type
  SNOW = 'snow'
}

export interface TerrainData {
  type: TerrainType;
  tx: number;
  ty: number;
  elevation: number;
  moisture: number;
}

const noise2D_elev = createNoise2D();
const noise2D_moist = createNoise2D();

/**
 * Normalizes simplex output [-1, 1] to [0, 1]
 */
function normalize(val: number): number {
  return (val + 1) / 2;
}

export class TerrainGen {
  static generate(tx: number, ty: number, seedStr: string = 'default'): TerrainData {
    // Zoomed in for larger continents and oceans (more continuous water)
    const SCALE = 0.015;
    const MOISTURE_SCALE = 0.02;
    
    // Layer 1: Elevation
    let elevation = normalize(noise2D_elev(tx * SCALE, ty * SCALE));
    // Layer 2: Moisture
    let moisture = normalize(noise2D_moist((tx + 1000) * MOISTURE_SCALE, (ty + 1000) * MOISTURE_SCALE));

    // Latitude (0 at equator, 1 at poles)
    // Equator is the line where tx + ty = MAP_SIZE
    const MAP_SIZE = 4096;
    const latitude = Math.abs((tx + ty) - MAP_SIZE) / MAP_SIZE;
    
    // Temperature: warm at equator (latitude ~ 0), cold at poles (latitude ~ 1)
    const tempNoise = normalize(noise2D_elev((tx + 5000) * SCALE, (ty + 5000) * SCALE));
    const temperature = (1.0 - latitude) * 0.8 + tempNoise * 0.2;

    let type = TerrainType.DEEP_WATER;

    // Biome determination (Aiming for ~70% water)
    if (elevation < 0.5) {
      type = TerrainType.DEEP_WATER;
    } else if (elevation < 0.65) {
      type = TerrainType.SHALLOW_WATER;
    } else if (elevation < 0.7) {
      type = TerrainType.COAST;
    } else if (elevation > 0.9) {
      type = TerrainType.MOUNTAIN;
    } else {
      // Land
      if (moisture < 0.3) {
        type = TerrainType.DESERT;
      } else if (moisture > 0.6) {
        type = TerrainType.FOREST;
      } else {
        type = TerrainType.GRASS;
      }
    }

    // Apply freezing temperatures (Poles)
    // Both land and water freeze at very low temperatures
    if (temperature < 0.25) {
      type = TerrainType.SNOW;
    }

    // Very naive road generation just to have it
    if (type !== TerrainType.DEEP_WATER && type !== TerrainType.SHALLOW_WATER && type !== TerrainType.COAST && type !== TerrainType.MOUNTAIN && type !== TerrainType.SNOW) {
      if (Math.abs(normalize(noise2D_elev(tx * 0.2, ty * 0.2)) - 0.5) < 0.01) {
        type = TerrainType.ROAD;
      }
    }

    return { type, tx, ty, elevation, moisture };
  }
}
