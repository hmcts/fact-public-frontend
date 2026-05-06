import { expect, test } from '@playwright/test';

import cy_i18n from '../../../main/locales/cy/prefix-search.json';
import en_i18n from '../../../main/locales/en/prefix-search.json';
import { CourtTestData, FUNCTIONAL_TEST_RUN_PREFIX, createCourtTestData } from '../helpers/courtTestData';
import { PrefixSearchPage } from '../page-objects/PrefixSearchPage';

test.describe('Prefix Search Page', () => {
  let courtData: CourtTestData;

  test.beforeAll(async ({ playwright }) => {
    if (!process.env.DATA_API_URL) {
      return;
    }
    courtData = await createCourtTestData(playwright, 'prefix-search');
  });

  test.afterAll(async () => {
    if (courtData) {
      await courtData.cleanup();
    }
  });

  test.describe('Prefix Search Page', () => {
    test('should render the prefix search page with all alphabet buttons in both English and Welsh', async ({
      page,
    }) => {
      const prefixSearchPage = new PrefixSearchPage(page);
      await prefixSearchPage.goto('en');
      await prefixSearchPage.expectHeadingToContainText(en_i18n.heading);
      await prefixSearchPage.expectVisibleElements();

      await prefixSearchPage.goto('cy');
      await prefixSearchPage.expectHeadingToContainText(cy_i18n.heading);
      await prefixSearchPage.expectVisibleElements();
    });

    test('should show error when submitting an invalid prefix query', async ({ page }) => {
      const prefixSearchPage = new PrefixSearchPage(page);

      for (const invalidPrefix of ['1', 'bb', '$']) {
        await prefixSearchPage.goto('en', invalidPrefix);
        await prefixSearchPage.expectErrorSummaryToContainText(en_i18n.error.invalidPrefix);
      }
    });

    test('should display results when an alphabet button is clicked', async ({ page }) => {
      const prefixSearchPage = new PrefixSearchPage(page);
      await prefixSearchPage.goto('en');
      await prefixSearchPage.clickAlphabetButton('C');

      await expect(page.locator('#header-hint')).toContainText("courts or tribunals starting with 'C'");
    });

    test('should show the correct number of results for a given prefix', async ({ page }) => {
      if (!courtData) {
        test.skip(true, 'DATA_API_URL not set, cannot run test requiring test data');
      }
      const prefixSearchPage = new PrefixSearchPage(page);
      await prefixSearchPage.goto('en', FUNCTIONAL_TEST_RUN_PREFIX.charAt(0));

      const courts = [
        courtData.defaultCourt,
        courtData.warningNoticeCourt,
        courtData.translationCourt,
        courtData.noTranslationCourt,
        courtData.noEnquiriesCourt,
      ];

      for (const court of courts) {
        const courtLink = await prefixSearchPage.getCourtLink(court.name);
        await prefixSearchPage.expectVisible(courtLink);
      }

      await prefixSearchPage.expectResultsListToBeVisible();
    });
  });
});
