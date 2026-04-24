import { retryWithAttempts } from "./retry-with-attempts"

describe("retryWithAttempts", () => {
  it("1回目で成功 → その値を返す", async () => {
    const result = await retryWithAttempts(
      () => Promise.resolve("ok"),
      3,
      "test",
    )
    expect(result).toBe("ok")
  })

  it("最初はnull、途中で成功 → リトライ後に値を返す", async () => {
    let call = 0
    const fn = () => {
      call++
      return Promise.resolve(call >= 3 ? "done" : null)
    }
    const result = await retryWithAttempts(fn, 5, "test")
    expect(result).toBe("done")
  })

  it("全部null → Error を投げる（メッセージに context と maxAttempts が含まれる）", async () => {
    await expect(
      retryWithAttempts(() => Promise.resolve(null), 3, "myContext"),
    ).rejects.toThrow(/myContext/)

    await expect(
      retryWithAttempts(() => Promise.resolve(null), 3, "myContext"),
    ).rejects.toThrow(/3/)
  })

  it("例外を投げる → リトライ後に Error を投げる（lastError が含まれる）", async () => {
    const fn = () => Promise.reject(new Error("boom"))
    await expect(retryWithAttempts(fn, 2, "ctx")).rejects.toThrow(/boom/)
  })

  it("maxAttempts=1 → 1回しか試行しない", async () => {
    let calls = 0
    const fn = () => {
      calls++
      return Promise.resolve(null)
    }
    await expect(retryWithAttempts(fn, 1, "once")).rejects.toThrow()
    expect(calls).toBe(1)
  })
})
