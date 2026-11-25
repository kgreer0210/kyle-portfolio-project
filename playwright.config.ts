import { defineConfig, devices } from "@playwright/test";

// Browser layout checks that need a real rendering engine (Chromium and
// WebKit, the engine behind Safari). These run against a production build:
//
//   npm run build
//   npx playwright install chromium webkit   # once per machine
//   npm run test:layout
//
// They are not part of `npm test` or CI, which have no browsers installed.
const PORT = Number(process.env.LAYOUT_PORT ?? 3210);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
