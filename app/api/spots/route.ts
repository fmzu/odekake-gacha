import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://z.overpass-api.de/api/interpreter",
]

async function fetchOverpass(query: string): Promise<Response> {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(15000),
      })
      if (res.ok) return res
    } catch {
      continue
    }
  }
  throw new Error("All Overpass endpoints failed")
}

export async function GET(request: NextRequest) {
  const prefecture = request.nextUrl.searchParams.get("prefecture")
  if (!prefecture) {
    return NextResponse.json(
      { error: "prefectureパラメータが必要です" },
      { status: 400 }
    )
  }

  const query = `
[out:json][timeout:15];
area["name"="${prefecture}"]->.a;
node["tourism"~"attraction|museum|viewpoint"](area.a);
out body 50;
`

  try {
    const res = await fetchOverpass(query)
    const data = await res.json()
    const spots = data.elements
      .filter((el: { tags?: { name?: string } }) => el.tags?.name)
      .map((el: { tags: { name: string; tourism?: string }; lat: number; lon: number }) => ({
        name: el.tags.name,
        tourism: el.tags.tourism ?? "attraction",
        lat: el.lat,
        lon: el.lon,
      }))
    return NextResponse.json({ spots })
  } catch {
    return NextResponse.json(
      { error: "サーバーに接続できません" },
      { status: 502 }
    )
  }
}
