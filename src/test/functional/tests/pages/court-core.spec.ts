import { DateTime } from 'luxon';

import { expect, test } from '../../fixtures';
import { CourtTestData, FUNCTIONAL_TEST_RUN_PREFIX, createCourtTestData } from '../../helpers/courtTestData';
import { generateRandomString, hasText } from '../../helpers/courtTestUtils';
import { createCourt, deleteCourtsByPrefix } from '../../helpers/testingSupportClient';

test.describe('Court Page Core', () => {
  let courtData!: CourtTestData;

  test.beforeAll(async ({ playwright }) => {
    courtData = await createCourtTestData(playwright, 'Core');
  });

  test.afterAll(async () => {
    if (courtData) {
      await courtData.cleanup();
    }
  });

  test('should display the dynamically created court', async ({ courtPage }) => {
    await courtPage.goto(courtData.defaultCourt.slug, 'en');
    await courtPage.expectHeadingToContainText(courtData.defaultCourt.name);
    await courtPage.expectVisibleElements();
  });

  test('should render the page title and last reviewed date in English and Welsh', async ({ page, courtPage }) => {
    const expectedEnglishDate = DateTime.fromISO(courtData.defaultCourt.body.lastUpdatedAt, { zone: 'Europe/London' })
      .setLocale('en')
      .toFormat('d LLLL yyyy');
    const expectedWelshDate = DateTime.fromISO(courtData.defaultCourt.body.lastUpdatedAt, { zone: 'Europe/London' })
      .setLocale('cy')
      .toFormat('d LLLL yyyy');

    await courtPage.goto(courtData.defaultCourt.slug, 'en');
    await expect(page).toHaveTitle(`${courtData.defaultCourt.name} - Find a Court or Tribunal - GOV.UK`);
    await courtPage.expectMainContentToContainText(`Page last reviewed: ${expectedEnglishDate}`);

    await courtPage.goto(courtData.defaultCourt.slug, 'cy');
    await expect(page).toHaveTitle(`${courtData.defaultCourt.name} - Dod o hyd i Lys neu Dribiwnlys - GOV.UK`);
    await courtPage.expectMainContentToContainText(`Adolygwyd y dudalen hon ddiwethaf ar: ${expectedWelshDate}`);
  });

  test('should not render a warning notice when one was not requested', async ({ page, courtPage }) => {
    await courtPage.goto(courtData.defaultCourt.slug, 'en');

    if (hasText(courtData.defaultCourt.body.warningNotice)) {
      test.fail(true, 'The default test court unexpectedly included a warning notice');
    }

    await expect(page.locator('.govuk-warning-text')).toHaveCount(0);
  });

  test('should render a warning notice when one was requested', async ({ page, courtPage }) => {
    await courtPage.goto(courtData.warningNoticeCourt.slug, 'en');

    const warningNotice = courtData.warningNoticeCourt.body.warningNotice;
    expect(hasText(warningNotice)).toBeTruthy();
    if (hasText(warningNotice)) {
      await expect(page.locator('.govuk-warning-text')).toContainText(warningNotice);
    }
  });

  test('should load and display correct content sections (english)', async ({ courtPage }) => {
    await courtPage.goto(courtData.defaultCourt.slug, 'en');
    await courtPage.expectVisibleElements();
    await courtPage.expectLanguageLinkToContainText('Cymraeg');
  });

  test('should load and display correct content sections (welsh)', async ({ courtPage }) => {
    await courtPage.goto(courtData.defaultCourt.slug, 'cy');
    await courtPage.expectVisibleElements();
    await courtPage.expectLanguageLinkToContainText('English');
  });

  test('should toggle language between English and Welsh', async ({ page, courtPage }) => {
    await courtPage.goto(courtData.defaultCourt.slug);
    await courtPage.expectLanguageLinkToContainText('Cymraeg');

    await page.click('a.fact-language');
    await courtPage.expectLanguageLinkToContainText('English');
    await page.waitForURL(/lng=cy/);
  });

  test('should maintain preselected language during navigation', async ({ courtPage, homePage }) => {
    await courtPage.goto(courtData.defaultCourt.slug, 'en');
    await courtPage.goto(courtData.defaultCourt.slug);
    await courtPage.expectVisibleElements();
    await courtPage.expectLanguageLinkToContainText('Cymraeg');

    await homePage.goto('cy');
    await courtPage.goto(courtData.defaultCourt.slug);
    await courtPage.expectVisibleElements();
    await courtPage.expectLanguageLinkToContainText('English');
  });

  test('should display static content sections', async ({ courtPage }) => {
    await courtPage.goto(courtData.defaultCourt.slug);
    await courtPage.expectAddressesToBeVisible();
    await courtPage.expectOpeningHoursToBeVisible();
  });

  test('should verify photo renders correctly', async ({ courtPage }) => {
    await courtPage.goto(courtData.defaultCourt.slug);
    const photo = courtData.defaultCourt.body.courtPhotos[0];
    if (photo?.fileLink) {
      await courtPage.expectCourtPhotoToBeVisible(photo.fileLink, courtData.defaultCourt.name);
    }
  });

  test('Closed-court page is rendered when the retrieved court is closed', async ({ courtPage }) => {
    const courtName = `${FUNCTIONAL_TEST_RUN_PREFIX} Core Test Closed Court ${generateRandomString()}`;
    const closedCourtResponseBody = await createCourt(courtData.apiContext, {
      courtName,
      open: false,
    });
    await courtPage.goto(closedCourtResponseBody.slug);
    await courtPage.expectHeadingToContainText(closedCourtResponseBody.name);
    await courtPage.expectMainContentToContainText(
      'This court or tribunal is no longer in service. Business has been transferred to other neighbouring courts.'
    );
    await deleteCourtsByPrefix(courtData.apiContext, courtName);
  });

  test('Not found page is rendered when the court does not exist', async ({ page, courtPage }) => {
    await courtPage.goto('not-a-real-slug');
    const sectionContent = page.locator('h1.govuk-heading-xl');
    await expect(sectionContent).toContainText('Page Not Found');
    await courtPage.expectMainContentToContainText('If you typed the web address, check it is correct.');
    await courtPage.expectMainContentToContainText(
      'If you pasted the web address, check you copied the entire address.'
    );
  });
});
