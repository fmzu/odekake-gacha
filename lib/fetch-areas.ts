import { fetchFromApi } from "./fetch-from-api"

export const fetchAreas = () => fetchFromApi<string>("areas", {}, "areas")
