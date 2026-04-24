import { fetchAreas } from "@/lib/fetch-areas"
import { fetchPrefectures } from "@/lib/fetch-prefectures"
import { fetchSpots } from "@/lib/fetch-spots"
import { pickRandom } from "@/lib/pick-random"
import { retryWithAttempts } from "@/lib/retry-with-attempts"
import type { FilterOptions, SpotResult } from "@/lib/types"

/**
 * 日本全国（またはフィルタ指定範囲）からランダムに観光地を1つ取得するフォールバック関数。
 * /api/areas → /api/prefectures → /api/spots を順に叩いて
 * 空でない観光地リストを引けるまで最大 MAX_ATTEMPTS 回リトライする。
 *
 * 戻り値:
 *  - spot: 結果カードに表示する SpotResult
 *  - lon/lat: 地図上のダーツ着弾座標に使う経度・緯度
 */
const MAX_ATTEMPTS = 5

type SpotWithCoords = {
  spot: SpotResult
  lon: number
  lat: number
}

export async function fallbackRandomSpot(
  filter?: FilterOptions,
): Promise<SpotWithCoords> {
  if (filter?.prefecture) {
    return retryWithAttempts(
      () => pickSpotFromPrefecture(filter.prefecture as string),
      MAX_ATTEMPTS,
      `fallbackRandomSpot(prefecture=${filter.prefecture})`,
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
      return pickSpotFromPrefecture(prefecture)
    },
    MAX_ATTEMPTS,
    "fallbackRandomSpot",
  )
}

async function pickSpotFromPrefecture(
  prefecture: string,
): Promise<SpotWithCoords | null> {
  const spots = await fetchSpots(prefecture)
  if (spots.length === 0) return null

  const spot = pickRandom(spots)
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
  }
}
