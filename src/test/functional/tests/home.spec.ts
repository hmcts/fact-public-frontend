import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load and display correct content', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/GOV\.UK/);
    await expect(page.locator('h1.govuk-heading-xl')).toContainText('Default page template');
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test('should be accessible @a11y', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .exclude('.govuk-footer__licence-logo')
      .exclude('.govuk-footer__crown')
      .exclude('.govuk-phase-banner')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
