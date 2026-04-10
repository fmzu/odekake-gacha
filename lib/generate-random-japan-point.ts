export const JAPAN_BOUNDS = {
  minLon: 122,
  maxLon: 146,
  minLat: 24,
  maxLat: 46,
} as const;

export type JapanPoint = { lon: number; lat: number };

export function generateRandomJapanPoint(): JapanPoint {
  const lon =
    JAPAN_BOUNDS.minLon +
    Math.random() * (JAPAN_BOUNDS.maxLon - JAPAN_BOUNDS.minLon);
  const lat =
    JAPAN_BOUNDS.minLat +
    Math.random() * (JAPAN_BOUNDS.maxLat - JAPAN_BOUNDS.minLat);
  return { lon, lat };
}
