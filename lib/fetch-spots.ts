import type { Spot } from "@/lib/types";

export async function fetchSpots(prefecture: string): Promise<Spot[]> {
  const res = await fetch(
    `/api/spots?prefecture=${encodeURIComponent(prefecture)}`,
  );
  const data = await res.json();
  return data.spots as Spot[];
}
