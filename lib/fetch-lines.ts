import { fetchFromApi } from "./fetch-from-api"

export const fetchLines = (prefecture: string) =>
  fetchFromApi<string>("lines", { prefecture }, "lines")
