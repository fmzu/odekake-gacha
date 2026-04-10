import { geoContains } from "d3-geo";
import {
  generateRandomJapanPoint,
  type JapanPoint,
} from "./generate-random-japan-point";
import type { JapanFeatureCollection } from "./load-japan-topojson";

const MAX_ATTEMPTS = 200;

/**
 * 日本のバウンディングボックス内でランダム点を生成し、
 * 都道府県ポリゴンに含まれる（陸地）点のみを返す。
 *
 * d3-geo の geoContains は FeatureCollection を直接受け取れるため、
 * feature ごとのループは不要。
 */
export function generateRandomLandPoint(
  features: JapanFeatureCollection,
): JapanPoint {
  for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
    const point = generateRandomJapanPoint();
    if (geoContains(features, [point.lon, point.lat])) {
      return point;
    }
  }
  throw new Error(
    `generateRandomLandPoint: ${MAX_ATTEMPTS}回試行しても陸地点が見つかりませんでした`,
  );
}
