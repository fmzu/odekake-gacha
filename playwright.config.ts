import { defineConfig, devices } from "@playwright/test"

/**
 * Playwright E2E 設定。
 * - tests/e2e/ 配下のみを対象にし、vitest のユニットテスト (lib/*) と完全分離する
 * - webServer は ローカルで既に起動中の dev サーバーを再利用する
 *   （reuseExistingServer: true）
 * - CI では失敗時のみリトライし、ローカルではリトライしない
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
