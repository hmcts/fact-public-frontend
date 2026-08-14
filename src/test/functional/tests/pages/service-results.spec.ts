import cy_pnf_i18n from '../../../../main/locales/cy/not-found.json';
import cy_i18n from '../../../../main/locales/cy/service-results.json';
import en_pnf_i18n from '../../../../main/locales/en/not-found.json';
import en_i18n from '../../../../main/locales/en/service-results.json';
import { expect, test } from '../../fixtures';

// Test data for a known service/serviceArea with a national catchment
const testService = 'money';
const testServiceArea = 'probate';

test.describe('Service Results Page', { tag: '@functional' }, () => {
  test('should render service results page (EN)', async ({ serviceResultsPage }) => {
    await serviceResultsPage.goto({ service: testService, serviceArea: testServiceArea, lng: 'en' });
    await serviceResultsPage.expectHeadingToContainText(en_i18n.question);
    await serviceResultsPage.expectVisibleElements();
    await serviceResultsPage.expectRegionStatementToBeVisible(en_i18n.regionStatement);
    // can't make the assumption that a court will be present in the results
    await serviceResultsPage.expectOnlineSectionToBeVisible();
  });

  test('should render service results page (CY)', async ({ serviceResultsPage }) => {
    await serviceResultsPage.goto({ service: testService, serviceArea: testServiceArea, lng: 'cy' });
    await serviceResultsPage.expectHeadingToContainText(cy_i18n.question);
    await serviceResultsPage.expectVisibleElements();
    await serviceResultsPage.expectRegionStatementToBeVisible(cy_i18n.regionStatement);
    // can't make the assumption that a court will be present in the results
    await serviceResultsPage.expectOnlineSectionToBeVisible();
  });

  test('should render not found page for invalid service (EN)', async ({ page, serviceResultsPage }) => {
    await serviceResultsPage.goto({ service: 'invalid', serviceArea: testServiceArea, lng: 'en' });
    await page.waitForSelector('h1.govuk-heading-xl');
    await expect(page.locator('h1.govuk-heading-xl')).toContainText(en_pnf_i18n.heading);
  });

  test('should render not found page for invalid service (CY)', async ({ page, serviceResultsPage }) => {
    await serviceResultsPage.goto({ service: 'invalid', serviceArea: testServiceArea, lng: 'cy' });
    await page.waitForSelector('h1.govuk-heading-xl');
    await expect(page.locator('h1.govuk-heading-xl')).toContainText(cy_pnf_i18n.heading);
  });

  test('should render not found page for invalid service area (EN)', async ({ page, serviceResultsPage }) => {
    await serviceResultsPage.goto({ service: testService, serviceArea: 'invalid', lng: 'en' });
    await page.waitForSelector('h1.govuk-heading-xl');
    await expect(page.locator('h1.govuk-heading-xl')).toContainText(en_pnf_i18n.heading);
  });

  test('should render not found page for invalid service area (CY)', async ({ page, serviceResultsPage }) => {
    await serviceResultsPage.goto({ service: testService, serviceArea: 'invalid', lng: 'cy' });
    await page.waitForSelector('h1.govuk-heading-xl');
    await expect(page.locator('h1.govuk-heading-xl')).toContainText(cy_pnf_i18n.heading);
  });
});
