import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/test/a11y',
  fullyParallel: false,
  forbidOnly: true,
  retries: 2,
  workers: 1,

  reporter: [['list'], ['html', { outputFolder: 'playwright-report/a11y', open: 'never' }]],

  globalSetup: require.resolve('./src/test/a11y/a11y-setup'),
  globalTeardown: require.resolve('./src/test/a11y/a11y-teardown'),

  use: {
    baseURL: process.env.A11Y_TEST_URL, // Set by a11y-setup
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
