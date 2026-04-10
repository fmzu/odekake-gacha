import { geoMercator, type GeoProjection } from "d3-geo";

export const JAPAN_MAP_DEFAULT_WIDTH = 600;
export const JAPAN_MAP_DEFAULT_HEIGHT = 640;

/**
 * 日本全土が収まる geoMercator projection を生成する。
 * 描画用 SVG と着弾座標の変換で同じインスタンスを共有するために使う。
 */
export function createJapanProjection(
  width: number = JAPAN_MAP_DEFAULT_WIDTH,
  height: number = JAPAN_MAP_DEFAULT_HEIGHT,
): GeoProjection {
  // 経度 137.5 / 緯度 38 付近を中心にすると本州～北海道～九州までバランスよく収まる
  const scale = Math.min(width, height) * 2.8;
  return geoMercator()
    .center([137.5, 38])
    .scale(scale)
    .translate([width / 2, height / 2]);
}
