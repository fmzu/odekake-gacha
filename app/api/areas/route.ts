import { NextResponse } from "next/server"

export async function GET() {
  try {
    const res = await fetch(
      "http://express.heartrails.com/api/json?method=getAreas",
    )
    if (!res.ok) {
      return NextResponse.json({ error: "外部APIエラー" }, { status: 502 })
    }
    const data = await res.json()
    return NextResponse.json({ areas: data.response.area })
  } catch {
    return NextResponse.json(
      { error: "サーバーに接続できません" },
      { status: 502 },
    )
  }
}
