import { test } from '@playwright/test';
import { DateTime } from 'luxon';

import { CourtPage } from '../page-objects/CourtPage';
import { HomePage } from '../page-objects/HomePage';

function generateRandomString(): string {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < 5; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

test.describe('Court Page with dynamic data', () => {
  let apiContext;
  let responseBody;
  let courtSlug: string;
  const courtName = 'Test Court ' + generateRandomString();

  test.beforeAll(async ({ playwright }) => {
    apiContext = await playwright.request.newContext({
      baseURL: `${process.env.DATA_API_URL}`,
      extraHTTPHeaders: {
        Accept: 'application/json',
      },
    });
    const response = await apiContext.get('/testing-support/courts', {
      params: {
        courtName,
        serviceCenter: false,
        open: true,
      },
    });
    responseBody = await response.json();
    courtSlug = responseBody.slug;
  });

  test.beforeEach(async () => {
    if (!courtSlug) {
      test.skip(true, 'Test court was not created successfully');
    }
  });

  test.afterAll(async () => {
    await apiContext.delete(`/testing-support/courts/name-prefix/${courtName}`);
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

  test('should verify "Address" section content', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug);
    if (responseBody.courtAddresses.length > 0) {
      await courtPage.expectStaticSectionContent('Address', responseBody.courtAddresses[0].addressLine1);
      await courtPage.expectStaticSectionContent('Address', responseBody.courtAddresses[0].townCity);
      await courtPage.expectStaticSectionContent('Address', responseBody.courtAddresses[0].postcode);
    }
  });

  test('should verify "Opening hours" section content', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug);
    if (responseBody.courtOpeningHours.length > 0) {
      await courtPage.expectStaticSectionContent(
        'Opening hours',
        DateTime.fromFormat(responseBody.courtOpeningHours[0].openingTimesDetails[0].openingTime, 'HH:mm:ss', {
          zone: 'Europe/London',
        })
          .toFormat('h:mma')
          .toLowerCase()
      );
      await courtPage.expectStaticSectionContent(
        'Opening hours',
        DateTime.fromFormat(responseBody.courtOpeningHours[0].openingTimesDetails[0].closingTime, 'HH:mm:ss', {
          zone: 'Europe/London',
        })
          .toFormat('h:mma')
          .toLowerCase()
      );
    }
  });

  test('should verify "Useful Information" section content', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug);
    await courtPage.expectStaticSectionContent(
      'Useful Information',
      'Find information about what to expect coming to a court or tribunal'
    );
    await courtPage.expectStaticSectionContent(
      'Useful Information',
      'Find information about hearings and single justice procedure cases at this court'
    );
    await courtPage.expectStaticSectionContent(
      'Useful Information',
      'Some scammers are pretending to be from HMCTS or enforcement.'
    );
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
    if (responseBody.courtContactDetails.length > 0) {
      await courtPage.expectAccordionSectionContent('Contact details', responseBody.courtContactDetails[0].phoneNumber);
      await courtPage.expectAccordionSectionContent('Contact details', responseBody.courtContactDetails[0].email);
    }
  });

  test('should verify "Cases heard" section content', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug);
    await courtPage.expandAccordionSection('Cases heard');
    await courtPage.expectAccordionSectionContent('Cases heard', 'The types of cases that are heard at this location');
  });

  test('should verify "Translation and interpretation" section content', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug);
    await courtPage.expandAccordionSection('Translation and interpretation');
    await courtPage.expectAccordionSectionContent(
      'Translation and interpretation',
      'Find out more information about getting an interpreter at a court or tribunal (opens in a new tab).'
    );
  });

  test('should verify "Accessibility" section content', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug);
    await courtPage.expandAccordionSection('Accessibility');
    await courtPage.expectAccordionSectionContent(
      'Accessibility',
      'Contact the court to find out what help you can get'
    );
    if (responseBody.courtAccessibilityOptions.length > 0) {
      await courtPage.expectAccordionSectionContent(
        'Accessibility',
        responseBody.courtAccessibilityOptions[0].accessibleToiletDescription
      );
    }
  });

  test('should verify "Building facilities" section content', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug);
    await courtPage.expandAccordionSection('Building facilities');
    await courtPage.expectAccordionSectionContent(
      'Building facilities',
      'Contact the court to find out what help you can get at court.'
    );
    if (responseBody.courtFacilities.length > 0) {
      if (responseBody.courtFacilities[0].parking) {
        await courtPage.expectAccordionSectionContent('Building facilities', 'Parking is available.');
      }
    }
  });

  test('should verify "Information for professionals" section content', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug);
    await courtPage.expandAccordionSection('Information for professionals');
    if (responseBody.courtProfessionalInformation.length > 0) {
      if (responseBody.courtProfessionalInformation[0].interviewRooms) {
        await courtPage.expectAccordionSectionContent(
          'Information for professionals',
          `There are ${responseBody.courtProfessionalInformation[0].interviewRoomCount} interview rooms available.`
        );
      }
    }
  });

  test('should verify "Make a complaint" section content', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug);
    await courtPage.expandAccordionSection('Make a complaint');
    await courtPage.expectAccordionSectionContent('Make a complaint', 'Contact us to make a complaint');
  });

  test('should toggle language between English and Welsh', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug);
    await courtPage.expectLanguageLinkToContainText('Cymraeg');

    await page.click('a.fact-language');
    await courtPage.expectLanguageLinkToContainText('English');

    await page.waitForURL(/lng=cy/);
  });
});
