import cy_i18n from '../../../../main/locales/cy/postcode-search.json';
import en_i18n from '../../../../main/locales/en/postcode-search.json';
import { expect, test } from '../../fixtures';
import { CourtTestData, createCourtTestData } from '../../helpers/courtTestData';

test.describe('Postcode Search Page', () => {
  let courtData!: CourtTestData;

  test.beforeAll(async ({ playwright }) => {
    courtData = await createCourtTestData(playwright, 'postcode-search');
  });

  test.afterAll(async () => {
    if (courtData) {
      await courtData.cleanup();
    }
  });

  test('should render the postcode search page (no service search)', async ({ postcodeSearchPage }) => {
    await postcodeSearchPage.goto({ lng: 'en' });
    await postcodeSearchPage.expectHeadingToContainText(en_i18n.question);
    await postcodeSearchPage.expectVisibleElements();

    await postcodeSearchPage.goto({ lng: 'cy' });
    await postcodeSearchPage.expectHeadingToContainText(cy_i18n.question);
    await postcodeSearchPage.expectVisibleElements();
  });

  test('should show error when submitting blank postcode', async ({ postcodeSearchPage }) => {
    await postcodeSearchPage.goto({ lng: 'en' });
    await postcodeSearchPage.submit();
    await postcodeSearchPage.expectErrorSummaryToContainText(en_i18n.errorText.blankPostcode);
  });

  test('should show error when submitting invalid postcode', async ({ postcodeSearchPage }) => {
    await postcodeSearchPage.goto({ lng: 'en' });
    await postcodeSearchPage.enterPostcode('INVALID');
    await postcodeSearchPage.submit();
    await postcodeSearchPage.expectErrorSummaryToContainText(en_i18n.errorText.invalidPostcode);
  });

  test('should redirect to courts/near with valid postcode (no service search) or no results', async ({
    page,
    postcodeSearchPage,
  }) => {
    await postcodeSearchPage.goto({ lng: 'en' });
    await postcodeSearchPage.enterPostcode('SW1A 1AA');
    await postcodeSearchPage.submit();
    await expect(page).toHaveURL(/\/search-by-postcode\/courts\/near\?postcode=SW1A%201AA/);
  });

  test('should render the postcode search page for a service search', async ({ postcodeSearchPage }) => {
    await postcodeSearchPage.goto({
      service: 'money',
      serviceArea: 'money-claims',
      action: 'nearest',
      lng: 'en',
    });
    await postcodeSearchPage.expectHeadingToContainText(en_i18n.question);
    await postcodeSearchPage.expectVisibleElements();
  });

  test('should redirect to service search courts/near with valid postcode, or no results', async ({
    page,
    postcodeSearchPage,
  }) => {
    await postcodeSearchPage.goto({
      service: 'money',
      serviceArea: 'money-claims',
      action: 'nearest',
      lng: 'en',
    });
    await postcodeSearchPage.enterPostcode('SW1A 1AA');
    await postcodeSearchPage.submit();
    await expect(page).toHaveURL(
      /\/services\/money\/money-claims\/nearest\/search-by-postcode(\/courts\/near\?postcode=SW1A%201AA|\?noResults=true)/
    );
  });

  test('should redirect to service search courts/near for documents action with valid postcode or no results', async ({
    page,
    postcodeSearchPage,
  }) => {
    await postcodeSearchPage.goto({
      service: 'money',
      serviceArea: 'money-claims',
      action: 'documents',
      lng: 'en',
    });
    await postcodeSearchPage.enterPostcode('SW1A 1AA');
    await postcodeSearchPage.submit();
    await expect(page).toHaveURL(
      /\/services\/money\/money-claims\/documents\/search-by-postcode(\/courts\/near\?postcode=SW1A%201AA|\?noResults=true)/
    );
  });
});
