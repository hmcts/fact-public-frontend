import { defineConfig, devices } from '@playwright/test';

// Validate TEST_URL in CI environments
if (process.env.CI && !process.env.TEST_URL) {
  throw new Error(
    'TEST_URL environment variable is required in CI. ' +
      'Tests should only run after deployment when TEST_URL is set to the deployed environment URL.'
  );
}

export default defineConfig({
  testDir: './src/test/functional',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 3 : undefined,

  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],

  use: {
    baseURL: process.env.TEST_URL || 'http://localhost:3344',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
