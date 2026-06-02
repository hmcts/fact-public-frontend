import { expect, test } from '@playwright/test';

import { HomePage } from '../page-objects/HomePage';

test.describe('Back Link', () => {
  test('should not be visible on the home page', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.expectBackLinkNotVisible();
  });

  test('should be visible on the choose action page and navigate back to the home page', async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.goto();
    await homePage.expectBackLinkNotVisible();

    await page.click('a.govuk-button--start');

    await expect(page).toHaveURL(/\/search-option/);
    const backLink = page.locator('a.govuk-back-link');
    await expect(backLink).toBeVisible();

    await backLink.click();

    await expect(page).toHaveURL(/\/$/);
    await homePage.expectBackLinkNotVisible();
  });

  test('should be visible and navigate back correctly after two pages', async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.goto();
    await page.click('a.govuk-button--start');
    const backLink = page.locator('a.govuk-back-link');

    await page.locator('input[name="knowsLocation"][value="yes"]').check();
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/search-by-name/);
    await expect(backLink).toBeVisible();

    await backLink.click();
    await expect(page).toHaveURL(/\/search-option/);
    await expect(backLink).toBeVisible();

    await backLink.click();
    await expect(page).toHaveURL(/\/$/);
    await homePage.expectBackLinkNotVisible();
  });
});
