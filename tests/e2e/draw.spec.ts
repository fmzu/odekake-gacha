import { expect, test } from "@playwright/test"

/**
 * おでかけおみくじの E2E テスト。
 *
 * 既存挙動を「固定」する目的で書く（仕様変更検出用）。
 * アニメーションシーケンス（drawing → waiting → extracting → revealing → done）
 * を含むため、結果表示・もう一回引くボタンの待機タイムアウトはやや長めに取る。
 *
 * 演出時間（hooks/use-gacha-draw.ts より）:
 *  - drawing:    0.5s
 *  - waiting:    最低 1.0s + API 応答待ち
 *  - extracting: 1.5s
 *  - revealing:  1.2s
 * → 合計の最低 4.2s + API 応答時間。20s あれば十分。
 */
const SEQUENCE_TIMEOUT_MS = 20_000

test.describe("おでかけおみくじ", () => {
  test("初期表示で見出しと「引く」ボタンが見える", async ({ page }) => {
    await page.goto("/")

    await expect(
      page.getByRole("heading", { name: "おでかけおみくじ" }),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "おみくじを引く" }),
    ).toBeVisible()
  })

  test("駅モードで引くと乗車券が表示される", async ({ page }) => {
    await page.goto("/")

    // 駅モードがデフォルトであることを確認
    await expect(page.getByRole("button", { name: /^駅$/ })).toBeVisible()

    await page.getByRole("button", { name: "おみくじを引く" }).click()

    // 乗車券のラベル "乗車券" が現れたら成功
    await expect(page.getByText("乗車券")).toBeVisible({
      timeout: SEQUENCE_TIMEOUT_MS,
    })

    // 「もう一回引く」ボタンが出てくる = done フェーズに到達
    await expect(
      page.getByRole("button", { name: /もう一回引く/ }),
    ).toBeVisible({ timeout: SEQUENCE_TIMEOUT_MS })
  })

  test("観光地モードに切り替えて引くとボーディングパスが表示される", async ({
    page,
  }) => {
    await page.goto("/")

    await page.getByRole("button", { name: /^観光地$/ }).click()
    await page.getByRole("button", { name: "おみくじを引く" }).click()

    // ボーディングパスのラベル "BOARDING PASS" が出る
    await expect(page.getByText("BOARDING PASS")).toBeVisible({
      timeout: SEQUENCE_TIMEOUT_MS,
    })
    await expect(page.getByText("DESTINATION")).toBeVisible({
      timeout: SEQUENCE_TIMEOUT_MS,
    })

    await expect(
      page.getByRole("button", { name: /もう一回引く/ }),
    ).toBeVisible({ timeout: SEQUENCE_TIMEOUT_MS })
  })

  test("エリアを選ぶと都道府県セレクトが活性化する", async ({ page }) => {
    await page.goto("/")

    // 範囲のセレクト群（順序通りに2つ）
    const selects = page.getByRole("combobox")
    const areaSelect = selects.first()
    const prefectureSelect = selects.nth(1)

    // 初期状態では都道府県セレクトは disabled（何も選んでいないから）
    await expect(prefectureSelect).toBeDisabled()

    // /api/areas の取得を待つために、エリアセレクトをクリック → 「関東」が現れるのを待つ
    await areaSelect.click()
    const kantoOption = page.getByRole("option", { name: "関東" })
    await expect(kantoOption).toBeVisible({ timeout: SEQUENCE_TIMEOUT_MS })
    await kantoOption.click()

    // 都道府県セレクトが活性化する
    await expect(prefectureSelect).toBeEnabled({
      timeout: SEQUENCE_TIMEOUT_MS,
    })
  })

  test("もう一回引くで再抽選できる", async ({ page }) => {
    await page.goto("/")

    // 1回目
    await page.getByRole("button", { name: "おみくじを引く" }).click()
    await expect(page.getByText("乗車券")).toBeVisible({
      timeout: SEQUENCE_TIMEOUT_MS,
    })
    const retry = page.getByRole("button", { name: /もう一回引く/ })
    await expect(retry).toBeVisible({ timeout: SEQUENCE_TIMEOUT_MS })

    // 2回目
    await retry.click()
    // もう一回引くボタンは抽選中いったん消える
    await expect(retry).toBeHidden({ timeout: SEQUENCE_TIMEOUT_MS })
    // 再度 done フェーズに到達して再表示される
    await expect(retry).toBeVisible({ timeout: SEQUENCE_TIMEOUT_MS })
  })

  test("抽選中はモード切替・フィルタ操作が disabled になる", async ({
    page,
  }) => {
    await page.goto("/")

    const stationModeBtn = page.getByRole("button", { name: /^駅$/ })
    const spotModeBtn = page.getByRole("button", { name: /^観光地$/ })
    const areaSelect = page.getByRole("combobox").first()

    // 引く前は active
    await expect(stationModeBtn).toBeEnabled()
    await expect(spotModeBtn).toBeEnabled()
    await expect(areaSelect).toBeEnabled()

    await page.getByRole("button", { name: "おみくじを引く" }).click()

    // 抽選中は disabled になる（drawing/waiting/extracting/revealing の間）
    await expect(stationModeBtn).toBeDisabled()
    await expect(spotModeBtn).toBeDisabled()
    await expect(areaSelect).toBeDisabled()

    // done に到達後は再び enabled
    await expect(
      page.getByRole("button", { name: /もう一回引く/ }),
    ).toBeVisible({ timeout: SEQUENCE_TIMEOUT_MS })
    await expect(stationModeBtn).toBeEnabled()
    await expect(spotModeBtn).toBeEnabled()
    await expect(areaSelect).toBeEnabled()
  })
})
