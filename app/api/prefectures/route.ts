import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const area = request.nextUrl.searchParams.get("area")
  if (!area) {
    return NextResponse.json(
      { error: "areaパラメータが必要です" },
      { status: 400 },
    )
  }

  try {
    const res = await fetch(
      `http://express.heartrails.com/api/json?method=getPrefectures&area=${encodeURIComponent(area)}`,
    )
    if (!res.ok) {
      return NextResponse.json({ error: "外部APIエラー" }, { status: 502 })
    }
    const data = await res.json()
    return NextResponse.json({ prefectures: data.response.prefecture })
  } catch {
    return NextResponse.json(
      { error: "サーバーに接続できません" },
      { status: 502 },
    )
  }
}
