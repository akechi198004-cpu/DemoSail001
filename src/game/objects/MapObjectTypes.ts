export type MapObjectType = 'CITY' | 'PORT' | 'VILLAGE' | 'RUIN' | 'DISCOVERY';

export interface MapObject {
  id: string;
  name: string;
  type: MapObjectType;
  tx: number;
  ty: number;
  isDiscovered: boolean;
  visibilityRange: number;
  interactionRange: number;
  description: string;
  iconType?: string; // Optional, can use type for now
}
