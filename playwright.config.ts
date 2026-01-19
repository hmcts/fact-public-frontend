import { CommonConfig, ProjectsConfig } from '@hmcts/playwright-common';
import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Playwright configuration for FACT Public Frontend
 * Based on HMCTS best practices
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  ...CommonConfig.recommended,

  testDir: './src/test/functional',

  // Maximum time one test can run
  timeout: 3 * 60 * 1000,

  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    [
      'odhin-reports-playwright',
      {
        outputFolder: 'playwright-odhin',
        reportName: 'FACT Public Frontend E2E Tests',
        title: 'FACT Public Frontend Test Results',
        project: 'fact-public-frontend',
        release: process.env.BUILD_NUMBER || 'local',
        environment: process.env.ENVIRONMENT || 'local',
        consoleLog: true,
        consoleError: true,
        testOutput: 'only-on-failure',
      },
    ],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for navigation
    baseURL: process.env.TEST_URL || 'http://localhost:3344',

    // Collect trace on first retry
    trace: 'retain-on-failure',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Ignore HTTPS errors (for local testing)
    ignoreHTTPSErrors: true,
  },

  // Configure projects for different browsers
  projects: [
    // Setup project - runs before all tests
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },

    // Chrome
    {
      ...ProjectsConfig.chrome,
      name: 'chrome',
      dependencies: ['setup'],
      testIgnore: /global\.(setup|teardown)\.ts/,
    },

    // Firefox
    {
      ...ProjectsConfig.firefox,
      name: 'firefox',
      dependencies: ['setup'],
      testIgnore: /global\.(setup|teardown)\.ts/,
    },

    // WebKit (Safari)
    {
      ...ProjectsConfig.webkit,
      name: 'webkit',
      dependencies: ['setup'],
      testIgnore: /global\.(setup|teardown)\.ts/,
    },

    // Teardown project - runs after all tests
    {
      name: 'teardown',
      testMatch: /global\.teardown\.ts/,
      dependencies: ['chrome', 'firefox', 'webkit'],
    },
  ],

  // Run local dev server before tests (optional)
  // webServer: {
  //   command: 'yarn start:dev',
  //   url: 'http://localhost:3344',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});
