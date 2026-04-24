import { TOURISM_LABELS } from "./tourism-labels"

describe("TOURISM_LABELS", () => {
  it("attraction → 観光スポット", () => {
    expect(TOURISM_LABELS.attraction).toBe("観光スポット")
  })

  it("museum → 博物館/美術館", () => {
    expect(TOURISM_LABELS.museum).toBe("博物館/美術館")
  })

  it("viewpoint → 展望スポット", () => {
    expect(TOURISM_LABELS.viewpoint).toBe("展望スポット")
  })
})
