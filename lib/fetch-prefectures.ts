import { fetchFromApi } from "./fetch-from-api"

export const fetchPrefectures = (area: string) =>
  fetchFromApi<string>("prefectures", { area }, "prefectures")
