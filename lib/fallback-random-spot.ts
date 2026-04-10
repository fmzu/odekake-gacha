import { fetchAreas } from "@/lib/fetch-areas";
import { fetchPrefectures } from "@/lib/fetch-prefectures";
import { fetchSpots } from "@/lib/fetch-spots";
import { pickRandom } from "@/lib/pick-random";
import type { FilterOptions, SpotResult } from "@/lib/types";

/**
 * 日本全国（またはフィルタ指定範囲）からランダムに観光地を1つ取得するフォールバック関数。
 * /api/areas → /api/prefectures → /api/spots を順に叩いて
 * 空でない観光地リストを引けるまで最大 MAX_ATTEMPTS 回リトライする。
 *
 * 戻り値:
 *  - spot: 結果カードに表示する SpotResult
 *  - lon/lat: 地図上のダーツ着弾座標に使う経度・緯度
 */
const MAX_ATTEMPTS = 5;

export async function fallbackRandomSpot(
  filter?: FilterOptions,
): Promise<{
  spot: SpotResult;
  lon: number;
  lat: number;
}> {
  // prefecture が指定されていれば area/prefecture 選択をスキップ
  if (filter?.prefecture) {
    return fallbackWithPrefecture(filter.prefecture);
  }

  const areas = filter?.area
    ? [filter.area]
    : await fetchAreas();
  if (areas.length === 0) {
    throw new Error("areas is empty");
  }

  let lastError: unknown = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      const area = pickRandom(areas);
      const prefectures = await fetchPrefectures(area);
      if (prefectures.length === 0) continue;
      const prefecture = pickRandom(prefectures);

      const spots = await fetchSpots(prefecture);
      if (spots.length === 0) continue;

      const spot = pickRandom(spots);
      return {
        spot: {
          type: "spot",
          name: spot.name,
          tourism: spot.tourism,
          prefecture,
          lat: spot.lat,
          lon: spot.lon,
        },
        lon: spot.lon,
        lat: spot.lat,
      };
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(
    `fallbackRandomSpot failed after ${MAX_ATTEMPTS} attempts: ${String(lastError)}`,
  );
}

async function fallbackWithPrefecture(
  prefecture: string,
): Promise<{ spot: SpotResult; lon: number; lat: number }> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      const spots = await fetchSpots(prefecture);
      if (spots.length === 0) continue;

      const spot = pickRandom(spots);
      return {
        spot: {
          type: "spot",
          name: spot.name,
          tourism: spot.tourism,
          prefecture,
          lat: spot.lat,
          lon: spot.lon,
        },
        lon: spot.lon,
        lat: spot.lat,
      };
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(
    `fallbackRandomSpot(prefecture=${prefecture}) failed after ${MAX_ATTEMPTS} attempts: ${String(lastError)}`,
  );
}
