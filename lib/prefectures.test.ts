import { PREFECTURES } from "./prefectures"

describe("PREFECTURES", () => {
  it("配列が47要素であること", () => {
    expect(PREFECTURES).toHaveLength(47)
  })

  it("東京都が含まれること", () => {
    expect(PREFECTURES).toContain("東京都")
  })

  it("北海道が含まれること", () => {
    expect(PREFECTURES).toContain("北海道")
  })

  it("沖縄県が含まれること", () => {
    expect(PREFECTURES).toContain("沖縄県")
  })
})
