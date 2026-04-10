import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { Station } from "@/lib/types"

export async function GET(request: NextRequest) {
  const lon = request.nextUrl.searchParams.get("lon")
  const lat = request.nextUrl.searchParams.get("lat")
  if (!lon || !lat) {
    return NextResponse.json(
      { error: "lon/latパラメータが必要です" },
      { status: 400 }
    )
  }

  try {
    const res = await fetch(
      `https://express.heartrails.com/api/json?method=getStations&x=${encodeURIComponent(lon)}&y=${encodeURIComponent(lat)}`,
      { signal: AbortSignal.timeout(15000) }
    )
    if (!res.ok) {
      return NextResponse.json(
        { error: "外部APIエラー" },
        { status: 502 }
      )
    }
    const data = await res.json()
    const rawStations: Station[] = data?.response?.station ?? []
    const seen = new Set<string>()
    const stations: Station[] = []
    for (const s of rawStations) {
      const key = `${s.name}__${s.prefecture}`
      if (seen.has(key)) continue
      seen.add(key)
      stations.push(s)
    }
    return NextResponse.json({ stations })
  } catch {
    return NextResponse.json(
      { error: "サーバーに接続できません" },
      { status: 502 }
    )
  }
}
