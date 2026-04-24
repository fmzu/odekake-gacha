import { fetchFromApi } from "./fetch-from-api"
import type { Spot } from "./types"

export const fetchSpots = (prefecture: string) =>
  fetchFromApi<Spot>("spots", { prefecture }, "spots")
