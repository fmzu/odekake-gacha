import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const line = request.nextUrl.searchParams.get("line")
  if (!line) {
    return NextResponse.json(
      { error: "lineパラメータが必要です" },
      { status: 400 }
    )
  }

  try {
    const res = await fetch(
      `http://express.heartrails.com/api/json?method=getStations&line=${encodeURIComponent(line)}`
    )
    if (!res.ok) {
      return NextResponse.json(
        { error: "外部APIエラー" },
        { status: 502 }
      )
    }
    const data = await res.json()
    return NextResponse.json({ stations: data.response.station })
  } catch {
    return NextResponse.json(
      { error: "サーバーに接続できません" },
      { status: 502 }
    )
  }
}
