import { generateTicketNumber } from "./generate-ticket-number"

describe("generateTicketNumber", () => {
  it("4桁の文字列を返す", () => {
    const num = generateTicketNumber()
    expect(num).toHaveLength(4)
  })

  it("数字のみで構成される", () => {
    const num = generateTicketNumber()
    expect(num).toMatch(/^\d{4}$/)
  })
})
