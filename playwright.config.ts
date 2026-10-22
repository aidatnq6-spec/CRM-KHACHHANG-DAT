import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: "npm.cmd run dev -- --port 3100",
    url: "http://127.0.0.1:3100",
    env: { NEXT_PUBLIC_CRM_TEST_MODE: "1" },
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
