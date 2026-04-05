import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const prefecture = request.nextUrl.searchParams.get("prefecture")
  if (!prefecture) {
    return NextResponse.json(
      { error: "prefectureパラメータが必要です" },
      { status: 400 }
    )
  }

  try {
    const res = await fetch(
      `http://express.heartrails.com/api/json?method=getLines&prefecture=${encodeURIComponent(prefecture)}`
    )
    if (!res.ok) {
      return NextResponse.json(
        { error: "外部APIエラー" },
        { status: 502 }
      )
    }
    const data = await res.json()
    return NextResponse.json({ lines: data.response.line })
  } catch {
    return NextResponse.json(
      { error: "サーバーに接続できません" },
      { status: 502 }
    )
  }
}
