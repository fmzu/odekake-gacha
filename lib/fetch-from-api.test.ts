import { fetchFromApi } from "./fetch-from-api"

describe("fetchFromApi", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("正常レスポンス → 配列を返す", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [1, 2, 3] }),
      }),
    )
    const result = await fetchFromApi("test", {}, "items")
    expect(result).toEqual([1, 2, 3])
  })

  it("パラメータ付き → URLにクエリパラメータが含まれる", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: ["a"] }),
    })
    vi.stubGlobal("fetch", mockFetch)
    await fetchFromApi("path", { foo: "bar" }, "data")
    expect(mockFetch).toHaveBeenCalledWith("/api/path?foo=bar")
  })

  it("res.ok が false → Error を投げる（status を含む）", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      }),
    )
    await expect(fetchFromApi("x", {}, "k")).rejects.toThrow(/404/)
  })

  it("data[key] が配列でない → Error を投げる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: "not-array" }),
      }),
    )
    await expect(fetchFromApi("x", {}, "items")).rejects.toThrow(
      /Expected array/,
    )
  })
})
