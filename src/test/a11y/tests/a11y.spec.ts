import { expect, test } from '@playwright/test';

import { ServiceCentreTestData, createServiceCentreTestData } from '../../functional/helpers/serviceCentreTestData';
import { AccessibilityPage } from '../../functional/page-objects/AccessibilityPage';
import { HomePage } from '../../functional/page-objects/HomePage';
import { NotFoundPage } from '../../functional/page-objects/NotFoundPage';
import { getAccessibilityViolations } from '../utils/accessibility';

test.describe('Homepage Accessibility', () => {
  test('should be accessible @a11y', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    const violations = await getAccessibilityViolations(page);

    expect(violations).toEqual([]);
  });
});

test.describe('Accessibility Page Accessibility', () => {
  test('should be accessible @a11y', async ({ page }) => {
    const accessibilityPage = new AccessibilityPage(page);
    await accessibilityPage.goto();

    const violations = await getAccessibilityViolations(page);

    expect(violations).toEqual([]);
  });
});

test.describe('Not found Page Accessibility', () => {
  test('should be accessible @a11y', async ({ page }) => {
    const notFoundPage = new NotFoundPage(page);
    await notFoundPage.goto();

    const violations = await getAccessibilityViolations(page);

    expect(violations).toEqual([]);
  });
});

test.describe('Service centre Page Accessibility', () => {
  let serviceCentreData!: ServiceCentreTestData;

  test.beforeAll(async ({ playwright }) => {
    serviceCentreData = await createServiceCentreTestData(playwright, 'accessibility');
  });

  test.afterAll(async () => {
    if (serviceCentreData) {
      await serviceCentreData.cleanup();
    }
  });

  test('should be accessible @a11y', async ({ page }) => {
    await page.goto(`/service-centres/${serviceCentreData.defaultServiceCentre.slug}`);
    await expect(page.locator('h1')).toHaveText(serviceCentreData.defaultServiceCentre.name);

    const violations = await getAccessibilityViolations(page);

    expect(violations).toEqual([]);
  });
});
