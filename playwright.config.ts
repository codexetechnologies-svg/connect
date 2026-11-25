import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3100';
const { port: configuredPort } = new URL(baseURL);
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
    command: 'node server/index.mjs',
    url: baseURL,
    reuseExistingServer: false,
    env: {
      NODE_ENV: 'development',
      PORT: port,
      ...(process.env.PLAYWRIGHT_TEST_DATABASE_URL
        ? {
            DATABASE_URL: process.env.PLAYWRIGHT_TEST_DATABASE_URL,
            NEON_DATABASE_URL: ''
          }
        : {})
    },
    timeout: 120_000
  }
});
