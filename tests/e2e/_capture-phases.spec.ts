import { expect, test } from "@playwright/test"

/**
 * 動作確認用：両モード（駅 / 観光地）で全フェーズのスクリーンショットを撮る。
 * /tmp/verify-{mode}-{phase}.png に保存する。
 *
 * このファイルは普段のE2E実行に含めたくない場合は --grep で指定してオンデマンド実行する。
 *   npx playwright test tests/e2e/_capture-phases.spec.ts
 *
 * フェーズ:
 *  - idle:       青空 + 引くボタン表示
 *  - drawing:    飛行機が右から登場（引くボタン直後 ~0.4s）
 *  - waiting:    飛行機が横切り続ける（drawing から ~0.7s 後）
 *  - extracting: 封筒が落下中（waiting 終了後 ~0.5s）
 *  - revealing:  チケット表示開始（extracting 終了後 ~0.5s）
 *  - done:       完了（もう一回引くボタン出現）
 *
 * 演出時間（hooks/use-gacha-draw.ts）:
 *   drawing 0.5s, waiting min 1.0s + API, extracting 1.5s, revealing 1.2s
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function capturePhases(
  page: import("@playwright/test").Page,
  mode: "station" | "spot",
) {
  await page.goto("/")

  if (mode === "spot") {
    await page.getByRole("button", { name: /^観光地$/ }).click()
  }

  // === idle ===
  await page.screenshot({ path: `/tmp/verify-${mode}-idle.png` })

  // 抽選開始
  await page.getByRole("button", { name: "おみくじを引く" }).click()

  // === drawing === (drawing 期間 0.5s の中盤を狙う)
  await sleep(200)
  await page.screenshot({ path: `/tmp/verify-${mode}-drawing.png` })

  // === waiting === (drawing 終了 → waiting 入って 0.5s 後あたり)
  await sleep(700)
  await page.screenshot({ path: `/tmp/verify-${mode}-waiting.png` })

  // === extracting === (waiting min 1.0s + α + extracting 入って 0.5s 後)
  // ここは API 応答時間に依存するので、subText を見てフェーズ判定する
  await page.waitForFunction(
    () => {
      const el = document.querySelector("p.min-h-\\[1\\.25rem\\]")
      const t = el?.textContent ?? ""
      return t.includes("封筒が舞い降りています")
    },
    null,
    { timeout: 15_000 },
  )
  await sleep(500)
  await page.screenshot({ path: `/tmp/verify-${mode}-extracting.png` })

  // === revealing === （revealing に入ったらチケットが見え始める）
  // 駅: "乗車券" / 観光地: "BOARDING PASS"
  if (mode === "station") {
    await expect(page.getByText("乗車券")).toBeVisible({ timeout: 15_000 })
  } else {
    await expect(page.getByText("BOARDING PASS")).toBeVisible({
      timeout: 15_000,
    })
  }
  await sleep(200)
  await page.screenshot({ path: `/tmp/verify-${mode}-revealing.png` })

  // === done ===
  await expect(page.getByRole("button", { name: /もう一回引く/ })).toBeVisible({
    timeout: 15_000,
  })
  await page.screenshot({ path: `/tmp/verify-${mode}-done.png` })
}

test.describe("[capture] フェーズ別スクリーンショット", () => {
  test("駅モード", async ({ page }) => {
    await capturePhases(page, "station")
  })

  test("観光地モード", async ({ page }) => {
    await capturePhases(page, "spot")
  })
})
