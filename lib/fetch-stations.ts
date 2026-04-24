import { fetchFromApi } from "./fetch-from-api"
import type { Station } from "./types"

export const fetchStations = (line: string) =>
  fetchFromApi<Station>("stations", { line }, "stations")
