import type { Spot } from "@/lib/types"

export async function fetchSpots(prefecture: string): Promise<Spot[]> {
  const res = await fetch(
    `/api/spots?prefecture=${encodeURIComponent(prefecture)}`,
  )
  if (!res.ok) throw new Error(`status ${res.status}`)
  const data = await res.json()
  return data.spots as Spot[]
}
