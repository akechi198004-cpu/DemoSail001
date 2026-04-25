export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;

/**
 * Convert tile coordinates (tx, ty) to isometric screen coordinates (sx, sy).
 */
export function tileToScreen(tx: number, ty: number): { x: number, y: number } {
  // Isometric projection
  const x = (tx - ty) * (TILE_WIDTH / 2);
  const y = (tx + ty) * (TILE_HEIGHT / 2);
  return { x, y };
}

/**
 * Convert isometric screen coordinates (sx, sy) to tile coordinates (tx, ty).
 */
export function screenToTile(sx: number, sy: number): { tx: number, ty: number } {
  const halfW = TILE_WIDTH / 2;
  const halfH = TILE_HEIGHT / 2;
  
  const tx = (sx / halfW + sy / halfH) / 2;
  const ty = (sy / halfH - sx / halfW) / 2;
  
  return { tx, ty };
}
