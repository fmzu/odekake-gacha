import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    // Playwright の E2E テスト (tests/e2e/) は vitest では実行しない
    exclude: ["**/node_modules/**", "**/.next/**", "tests/e2e/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
})
