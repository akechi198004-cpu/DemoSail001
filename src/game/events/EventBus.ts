export const EventBus = new EventTarget();

export interface MapStats {
  fps: number;
  camX: number;
  camY: number;
  tileX: number;
  tileY: number;
  chunkCount: number;
  tileCount: number;
  hoverTerrain: string;
}

export function dispatchMapStats(stats: MapStats) {
  const event = new CustomEvent('map-stats', { detail: stats });
  EventBus.dispatchEvent(event);
}
