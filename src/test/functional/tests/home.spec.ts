import { expect, test } from '@playwright/test';

import { getAccessibilityViolations } from '../utils/accessibility';

test.describe('Homepage @smoke', () => {
  test('should load and display correct content', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/GOV\.UK/);
    await expect(page.locator('h1.govuk-heading-xl')).toContainText('Default page template');
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test('should be accessible @a11y', async ({ page }) => {
    await page.goto('/');

    const violations = await getAccessibilityViolations(page);

    expect(violations).toEqual([]);
  });
});
