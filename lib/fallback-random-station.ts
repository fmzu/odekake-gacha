import { fetchAreas } from "@/lib/fetch-areas"
import { fetchLines } from "@/lib/fetch-lines"
import { fetchPrefectures } from "@/lib/fetch-prefectures"
import { fetchStations } from "@/lib/fetch-stations"
import { pickRandom } from "@/lib/pick-random"
import { retryWithAttempts } from "@/lib/retry-with-attempts"
import type { FilterOptions, StationResult } from "@/lib/types"

/**
 * 日本全国（またはフィルタ指定範囲）からランダムに駅を1つ取得するフォールバック関数。
 * /api/areas → /api/prefectures → /api/lines → /api/stations を順に叩いて
 * 確実に駅を見つけるまで最大 MAX_ATTEMPTS 回リトライする。
 *
 * 戻り値:
 *  - station: 結果カードに表示する StationResult
 *  - lon/lat: 地図上のダーツ着弾座標に使う経度・緯度
 */
const MAX_ATTEMPTS = 5

type StationWithCoords = {
  station: StationResult
  lon: number
  lat: number
}

export async function fallbackRandomStation(
  filter?: FilterOptions,
): Promise<StationWithCoords> {
  if (filter?.prefecture) {
    return retryWithAttempts(
      () => pickStationFromPrefecture(filter.prefecture as string),
      MAX_ATTEMPTS,
      `fallbackRandomStation(prefecture=${filter.prefecture})`,
    )
  }

  const areas = filter?.area ? [filter.area] : await fetchAreas()
  if (areas.length === 0) {
    throw new Error("areas is empty")
  }

  return retryWithAttempts(
    async () => {
      const area = pickRandom(areas)
      const prefectures = await fetchPrefectures(area)
      if (prefectures.length === 0) return null
      const prefecture = pickRandom(prefectures)
      return pickStationFromPrefecture(prefecture)
    },
    MAX_ATTEMPTS,
    "fallbackRandomStation",
  )
}

async function pickStationFromPrefecture(
  prefecture: string,
): Promise<StationWithCoords | null> {
  const lines = await fetchLines(prefecture)
  if (lines.length === 0) return null
  const line = pickRandom(lines)

  const allStations = await fetchStations(line)
  const stationsInPref = allStations.filter((s) => s.prefecture === prefecture)
  if (stationsInPref.length === 0) return null

  const station = pickRandom(stationsInPref)
  return {
    station: {
      type: "station",
      name: station.name,
      line,
      prefecture: station.prefecture,
    },
    lon: station.x,
    lat: station.y,
  }
}
