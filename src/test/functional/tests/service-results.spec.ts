import { expect, test } from '@playwright/test';

import cy_pnf_i18n from '../../../main/locales/cy/not-found.json';
import cy_i18n from '../../../main/locales/cy/service-results.json';
import en_pnf_i18n from '../../../main/locales/en/not-found.json';
import en_i18n from '../../../main/locales/en/service-results.json';
import { ServiceResultsPage } from '../page-objects/ServiceResultsPage';

// Test data for a known service/serviceArea with a national catchment
const testService = 'money';
const testServiceArea = 'probate';

test.describe('Service Results Page', () => {
  test('should render service results page (EN)', async ({ page }) => {
    const resultsPage = new ServiceResultsPage(page);
    await resultsPage.goto({ service: testService, serviceArea: testServiceArea, lng: 'en' });
    await resultsPage.expectHeadingToContainText(en_i18n.question);
    await resultsPage.expectVisibleElements();
    await resultsPage.expectRegionStatementToBeVisible(en_i18n.regionStatement);
    // can't make the assumption that a court will be present in the results
    await resultsPage.expectOnlineSectionToBeVisible();
  });

  test('should render service results page (CY)', async ({ page }) => {
    const resultsPage = new ServiceResultsPage(page);
    await resultsPage.goto({ service: testService, serviceArea: testServiceArea, lng: 'cy' });
    await resultsPage.expectHeadingToContainText(cy_i18n.question);
    await resultsPage.expectVisibleElements();
    await resultsPage.expectRegionStatementToBeVisible(cy_i18n.regionStatement);
    // can't make the assumption that a court will be present in the results
    await resultsPage.expectOnlineSectionToBeVisible();
  });

  test('should render not found page for invalid service (EN)', async ({ page }) => {
    const resultsPage = new ServiceResultsPage(page);
    await resultsPage.goto({ service: 'invalid', serviceArea: testServiceArea, lng: 'en' });
    await page.waitForSelector('h1.govuk-heading-xl');
    await expect(page.locator('h1.govuk-heading-xl')).toContainText(en_pnf_i18n.heading);
  });

  test('should render not found page for invalid service (CY)', async ({ page }) => {
    const resultsPage = new ServiceResultsPage(page);
    await resultsPage.goto({ service: 'invalid', serviceArea: testServiceArea, lng: 'cy' });
    await page.waitForSelector('h1.govuk-heading-xl');
    await expect(page.locator('h1.govuk-heading-xl')).toContainText(cy_pnf_i18n.heading);
  });

  test('should render not found page for invalid service area (EN)', async ({ page }) => {
    const resultsPage = new ServiceResultsPage(page);
    await resultsPage.goto({ service: testService, serviceArea: 'invalid', lng: 'en' });
    await page.waitForSelector('h1.govuk-heading-xl');
    await expect(page.locator('h1.govuk-heading-xl')).toContainText(en_pnf_i18n.heading);
  });

  test('should render not found page for invalid service area (CY)', async ({ page }) => {
    const resultsPage = new ServiceResultsPage(page);
    await resultsPage.goto({ service: testService, serviceArea: 'invalid', lng: 'cy' });
    await page.waitForSelector('h1.govuk-heading-xl');
    await expect(page.locator('h1.govuk-heading-xl')).toContainText(cy_pnf_i18n.heading);
  });
});
