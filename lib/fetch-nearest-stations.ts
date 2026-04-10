import type { Station } from "@/lib/types";

export async function fetchNearestStations(
  lon: number,
  lat: number,
): Promise<Station[]> {
  const res = await fetch(
    `/api/nearest-stations?lon=${encodeURIComponent(lon)}&lat=${encodeURIComponent(lat)}`,
  );
  if (!res.ok) throw new Error(`status ${res.status}`);
  const data = await res.json();
  return (data.stations ?? []) as Station[];
}
