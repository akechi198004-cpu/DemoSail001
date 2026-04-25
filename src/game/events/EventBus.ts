export const EventBus = new EventTarget() as EventTarget & {
  emit: (event: string, detail?: any) => void;
  on: (event: string, callback: (e: any) => void) => void;
  off: (event: string, callback: (e: any) => void) => void;
};

EventBus.emit = (event: string, detail: any = null) => {
  EventBus.dispatchEvent(new CustomEvent(event, { detail }));
};

EventBus.on = (event: string, callback: EventListenerOrEventListenerObject) => {
  EventBus.addEventListener(event, callback);
};

EventBus.off = (event: string, callback: EventListenerOrEventListenerObject) => {
  EventBus.removeEventListener(event, callback);
};

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
  EventBus.emit('map-stats', stats);
}

