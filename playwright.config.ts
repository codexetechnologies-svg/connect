import { defineConfig, devices } from '@playwright/test';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3100';
const { hostname, port: configuredPort } = new URL(baseURL);
const port = configuredPort || '3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: `npm run dev -- --hostname ${hostname} --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    env: {
      NODE_ENV: 'development',
      PLAYWRIGHT_TEST_MODE: '1'
    },
    timeout: 120_000
  }
});
