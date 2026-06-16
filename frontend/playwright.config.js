import { defineConfig, devices } from "@playwright/test";

// Tests run against the running stack (docker compose up) by default.
// Override with BASE_URL, e.g. BASE_URL=http://localhost:5173 for the dev server.
const baseURL = process.env.BASE_URL || "http://localhost:8095";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  expect: { timeout: 7000 },
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL,
    // Pin to Brazilian Portuguese — the product's default language — so tests
    // are deterministic regardless of the host browser's locale.
    locale: "pt-BR",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 5"] },
    },
  ],
});
