import cy_i18n from '../../../../main/locales/cy/postcode-results.json';
import en_i18n from '../../../../main/locales/en/postcode-results.json';
import { expect, test } from '../../fixtures';
import { CourtTestData, createCourtTestData } from '../../helpers/courtTestData';

test.describe('Postcode Results Page', { tag: '@functional' }, () => {
  let courtData!: CourtTestData;
  const testPostcode = 'SW1A 1AA';

  test.beforeAll(async ({ playwright }) => {
    courtData = await createCourtTestData(playwright, 'postcode-results');
  });

  test.afterAll(async () => {
    if (courtData) {
      await courtData.cleanup();
    }
  });

  test('should render results for postcode-only search (EN)', async ({ postcodeResultsPage }) => {
    await postcodeResultsPage.goto({ postcode: testPostcode, lng: 'en' });
    await postcodeResultsPage.expectHeadingToContainText(en_i18n.question);
    await postcodeResultsPage.expectVisibleElements();
  });

  test('should render results for postcode-only search (CY)', async ({ postcodeResultsPage }) => {
    await postcodeResultsPage.goto({ postcode: testPostcode, lng: 'cy' });
    await postcodeResultsPage.expectHeadingToContainText(cy_i18n.question);
    await postcodeResultsPage.expectVisibleElements();
  });

  test('should render results for service area search', async ({ page, postcodeResultsPage }) => {
    await postcodeResultsPage.goto({
      postcode: testPostcode,
      service: 'money',
      serviceArea: 'money-claims',
      action: 'nearest',
      lng: 'en',
    });
    await expect(page).toHaveURL(
      /\/services\/money\/money-claims\/nearest\/search-by-postcode(\/courts\/near\?postcode=SW1A%201AA|\?noResults=true)/
    );

    if (/noResults=true/.test(page.url())) {
      return;
    }

    await postcodeResultsPage.expectHeadingToContainText(en_i18n.question);
    await postcodeResultsPage.expectVisibleElements();
  });

  test('should show no results if postcode does not match any court', async ({ page, postcodeResultsPage }) => {
    await postcodeResultsPage.goto({ postcode: 'ZZ99 9ZZ', lng: 'en' });
    // Should redirect to search page with noResults param
    await expect(page).toHaveURL(/search-by-postcode\?noResults=true/);
  });
});
