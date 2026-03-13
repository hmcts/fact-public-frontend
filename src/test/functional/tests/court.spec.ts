import { test } from '@playwright/test';

import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import { CourtPage } from '../page-objects/CourtPage';
import { HomePage } from '../page-objects/HomePage';

test.describe('Court Page with dynamic data', () => {
  let requests: DataApiRequests;
  let courtSlug: string;
  const courtName = 'Test Court';

  test.beforeAll(async () => {
    requests = new DataApiRequests();
    const response = await requests.createTestCourt(courtName, false);
    if (typeof response === 'number') {
      return;
    } else {
      courtSlug = response.slug;
    }
  });

  test.afterAll(async () => {
    await requests.deleteCourtsByNamePrefix(courtName);
  });

  test('should display the dynamically created court', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug, 'en');

    await courtPage.expectHeadingToContainText(courtName);
    await courtPage.expectVisibleElements();
  });

  test('should load and display correct content sections (english)', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug, 'en');
    await courtPage.expectVisibleElements();

    await courtPage.expectLanguageLinkToContainText('Cymraeg');
  });

  test('should load and display correct content sections (welsh)', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug, 'cy');
    await courtPage.expectVisibleElements();

    await courtPage.expectLanguageLinkToContainText('English');
  });

  test('should maintain preselected language during navigation', async ({ page }) => {
    const homePage = new HomePage(page);
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug, 'en');
    await courtPage.goto(courtSlug);
    await courtPage.expectVisibleElements();
    await courtPage.expectLanguageLinkToContainText('Cymraeg');

    await homePage.goto('cy');
    await courtPage.goto(courtSlug);
    await courtPage.expectVisibleElements();
    await courtPage.expectLanguageLinkToContainText('English');
  });

  test('should display static content sections', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug);
    await courtPage.expectAddressesToBeVisible();
    await courtPage.expectOpeningHoursToBeVisible();
  });

  test('should verify all accordion sections are present', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug);
    const sections = [
      'Contact details',
      'Cases heard',
      'Translation and interpretation',
      'Accessibility',
      'Building facilities',
      'Information for professionals',
      'Make a complaint',
    ];

    for (const section of sections) {
      await courtPage.expectAccordionSectionVisible(section);
    }
  });

  test('should verify "Contact details" section content', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug);
    await courtPage.expandAccordionSection('Contact details');
    await courtPage.expectSectionContent('Contact details', 'Telephone');
    await courtPage.expectSectionContent('Contact details', 'Email');
  });

  test('should verify "Cases heard" section content', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug);
    await courtPage.expandAccordionSection('Cases heard');
    await courtPage.expectSectionContent('Cases heard', 'The types of cases that are heard at this location');
  });

  test('should verify "Accessibility" section content', async ({ page }) => {
    const courtPage = new CourtPage(page);

    await courtPage.expandAccordionSection('Accessibility');
    await courtPage.expectSectionContent('Accessibility', 'Contact the court to find out what help you can get');
  });

  test('should verify "Building facilities" section content', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug);
    await courtPage.expandAccordionSection('Building facilities');
    await courtPage.expectSectionContent('Building facilities', 'Parking');
    await courtPage.expectSectionContent('Building facilities', 'Security');
  });

  test('should verify "Information for professionals" section content', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug);
    await courtPage.expandAccordionSection('Information for professionals');
    await courtPage.expectSectionContent('Information for professionals', 'DX code');
  });

  test('should verify "Make a complaint" section content', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug);
    await courtPage.expandAccordionSection('Make a complaint');
    await courtPage.expectSectionContent('Make a complaint', 'Contact us to make a complaint');
  });

  test('should toggle language between English and Welsh', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug);
    await courtPage.expectLanguageLinkToContainText('Cymraeg');

    await page.click('a.fact-language');
    await courtPage.expectLanguageLinkToContainText('English');

    await page.waitForURL(/lng=cy/);
  });

  test('should display warning notice when present in data', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug);
    await courtPage.goto('test-court-with-warning');
    await courtPage.expectWarningNoticeToBeVisible();
  });
});
