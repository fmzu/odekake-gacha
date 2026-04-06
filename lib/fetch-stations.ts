import type { Station } from "@/lib/types";

export async function fetchStations(line: string): Promise<Station[]> {
  const res = await fetch(
    `/api/stations?line=${encodeURIComponent(line)}`,
  );
  const data = await res.json();
  return data.stations as Station[];
}
