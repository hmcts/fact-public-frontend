import { expect, test } from '../fixtures';

/**
 * Home Page Tests
 * Smoke tests for the main landing page
 */
test.describe('Home Page @smoke', () => {
  test('should display the home page', async ({ homePage }) => {
    // homePage fixture automatically navigates to the page
    await expect(homePage.heading).toBeVisible();
  });

  test('should have correct heading text', async ({ homePage }) => {
    const headingText = await homePage.getHeadingText();
    expect(headingText).toContain('Default page template');
  });

  test('should load main content', async ({ homePage }) => {
    await expect(homePage.mainContent).toBeVisible();
  });

  test('should have correct page title', async ({ homePage }) => {
    const title = await homePage.getTitle();
    expect(title).toBeTruthy();
  });
});
