import { formatTicketDate } from "./format-ticket-date"

describe("formatTicketDate", () => {
  it("特定の日付 → 'YYYY.M.D' 形式で返す", () => {
    const date = new Date(2026, 3, 24) // 2026年4月24日
    expect(formatTicketDate(date)).toBe("2026.4.24")
  })

  it("1桁の月・日もそのまま返す", () => {
    const date = new Date(2026, 0, 5) // 2026年1月5日
    expect(formatTicketDate(date)).toBe("2026.1.5")
  })
})
