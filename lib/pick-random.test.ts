import { pickRandom } from "./pick-random"

describe("pickRandom", () => {
  it("要素が1つの配列 → その要素を返す", () => {
    expect(pickRandom([42])).toBe(42)
  })

  it("空配列 → Error を投げる", () => {
    expect(() => pickRandom([])).toThrow(Error)
  })

  it("複数要素の配列 → 配列内の要素を返す", () => {
    const arr = [1, 2, 3]
    const results = new Set<number>()
    for (let i = 0; i < 10; i++) {
      results.add(pickRandom(arr))
    }
    for (const r of results) {
      expect(arr).toContain(r)
    }
  })
})
