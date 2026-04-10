import { fetchAreas } from "@/lib/fetch-areas";
import { fetchLines } from "@/lib/fetch-lines";
import { fetchPrefectures } from "@/lib/fetch-prefectures";
import { fetchStations } from "@/lib/fetch-stations";
import { pickRandom } from "@/lib/pick-random";
import type { StationResult } from "@/lib/types";

/**
 * 日本全国からランダムに駅を1つ取得するフォールバック関数。
 * /api/areas → /api/prefectures → /api/lines → /api/stations を順に叩いて
 * 確実に駅を見つけるまで最大 MAX_ATTEMPTS 回リトライする。
 *
 * 戻り値:
 *  - station: 結果カードに表示する StationResult
 *  - lon/lat: 地図上のダーツ着弾座標に使う経度・緯度
 */
const MAX_ATTEMPTS = 5;

export async function fallbackRandomStation(): Promise<{
  station: StationResult;
  lon: number;
  lat: number;
}> {
  const areas = await fetchAreas();
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

      const lines = await fetchLines(prefecture);
      if (lines.length === 0) continue;
      const line = pickRandom(lines);

      const allStations = await fetchStations(line);
      const stationsInPref = allStations.filter(
        (s) => s.prefecture === prefecture,
      );
      if (stationsInPref.length === 0) continue;

      const station = pickRandom(stationsInPref);
      return {
        station: {
          type: "station",
          name: station.name,
          line,
          prefecture: station.prefecture,
        },
        lon: station.x,
        lat: station.y,
      };
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(
    `fallbackRandomStation failed after ${MAX_ATTEMPTS} attempts: ${String(lastError)}`,
  );
}
