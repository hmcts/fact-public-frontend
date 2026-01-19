import { test as setup } from './fixtures';

/**
 * Global setup runs before all tests
 * Use this for authentication, database seeding, etc.
 */
setup.describe('Global Setup', () => {
  setup('Verify application is accessible', async ({ page, config }) => {
    // Navigate to base URL to verify app is running
    await page.goto(config.urls.baseUrl);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    console.log('✓ Application is accessible');
  });

  // Add more setup tasks here as needed:
  // - Authentication/login
  // - Test data creation
  // - Service health checks
});
