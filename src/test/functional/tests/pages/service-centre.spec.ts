import { DateTime } from 'luxon';

import { expect, test } from '../../fixtures';
import { ServiceCentreTestData, createServiceCentreTestData } from '../../helpers/serviceCentreTestData';

const scamLink = 'https://www.gov.uk/government/news/scammers-using-hmcts-telephone-numbers';

test.describe('Service Centre Page', () => {
  let serviceCentreData!: ServiceCentreTestData;

  test.beforeAll(async ({ playwright }) => {
    serviceCentreData = await createServiceCentreTestData(playwright, 'service-centre-page');
  });

  test.afterAll(async () => {
    if (serviceCentreData) {
      await serviceCentreData.cleanup();
    }
  });

  test('renders the API-backed English page in the required section order', async ({ page, serviceCentrePage }) => {
    const serviceCentre = serviceCentreData.defaultServiceCentre;
    const expectedDate = DateTime.fromISO(String(serviceCentre.body.lastUpdatedAt), { zone: 'Europe/London' })
      .setLocale('en')
      .toFormat('d LLLL yyyy');

    await serviceCentrePage.goto(serviceCentre.slug, 'en');

    await expect(page).toHaveTitle(`${serviceCentre.name} - Find a Court or Tribunal - GOV.UK`);
    await serviceCentrePage.expectHeadingToHaveText(serviceCentre.name);
    await serviceCentrePage.expectMainContentToContainText(`Page last reviewed: ${expectedDate}`);
    await serviceCentrePage.expectAddressesToContainText('Visit and send documents to');
    await serviceCentrePage.expectUsefulInformationToContainText('Scammers');
    await serviceCentrePage.expectAccordionButtonsToContainText(['Contact details', 'Cases heard']);
    await serviceCentrePage.expectSectionOrder([
      'h1',
      'addresses',
      'useful-information',
      'service-centre-details-accordion',
    ]);

    for (const excludedContent of [
      'Opening hours',
      'Coming to court',
      'Hearings at this court',
      'Translation and interpretation',
      'Accessibility',
      'Building facilities',
      'Information for professionals',
    ]) {
      await serviceCentrePage.expectMainContentNotToContainText(excludedContent);
    }
  });

  test('renders Welsh content and switches language', async ({ serviceCentrePage }) => {
    const serviceCentre = serviceCentreData.defaultServiceCentre;
    const expectedDate = DateTime.fromISO(String(serviceCentre.body.lastUpdatedAt), { zone: 'Europe/London' })
      .setLocale('cy')
      .toFormat('d LLLL yyyy');

    await serviceCentrePage.goto(serviceCentre.slug, 'en');
    await serviceCentrePage.expectLanguageLinkToContainText('Cymraeg');
    await serviceCentrePage.switchLanguageTo('cy');

    await serviceCentrePage.expectMainContentToContainText(`Adolygwyd y dudalen hon ddiwethaf ar: ${expectedDate}`);
    await serviceCentrePage.expectAddressesToContainText('Ewch i ac anfonwch ddogfennau i');
    await serviceCentrePage.expectUsefulInformationToContainText('Gwybodaeth ddefnyddiol');
    await serviceCentrePage.expectAccordionButtonsToContainText(['Manylion cyswllt', 'Achosion a wrandawyd']);
    await serviceCentrePage.expectLanguageLinkToContainText('English');

    await serviceCentrePage.expandAccordionSection('Achosion a wrandawyd');
    await serviceCentrePage.expectCasesHeardToBePopulated();
    await serviceCentrePage.expectFirstCaseLinkToOpenInNewTab();
  });

  test('renders conditional warning notices', async ({ serviceCentrePage }) => {
    await serviceCentrePage.goto(serviceCentreData.defaultServiceCentre.slug);
    await serviceCentrePage.expectWarningNoticeCount(0);

    await serviceCentrePage.goto(serviceCentreData.warningNoticeServiceCentre.slug);
    await serviceCentrePage.expectWarningNoticeToContainText(
      String(serviceCentreData.warningNoticeServiceCentre.body.warningNotice)
    );

    const welshWarningNotice = serviceCentreData.warningNoticeServiceCentre.body.warningNoticeCy;
    expect(welshWarningNotice).toBeTruthy();
    await serviceCentrePage.goto(serviceCentreData.warningNoticeServiceCentre.slug, 'cy');
    await serviceCentrePage.expectWarningNoticeToContainText(String(welshWarningNotice));
    await serviceCentrePage.expectWarningNoticeNotToContainText(
      String(serviceCentreData.warningNoticeServiceCentre.body.warningNotice)
    );
  });

  test('starts both accordion sections collapsed and expands contact and case content', async ({
    serviceCentrePage,
  }) => {
    const serviceCentre = serviceCentreData.defaultServiceCentre;
    await serviceCentrePage.goto(serviceCentre.slug, 'en');
    await serviceCentrePage.expectAccordionSectionsCollapsed(['Contact details', 'Cases heard']);

    await serviceCentrePage.expandAccordionSection('Contact details');
    await serviceCentrePage.expectContactTableCount(1);
    await serviceCentrePage.expectContactPhoneTextToBeVisible();
    await serviceCentrePage.expectContactPhoneLinkCount(1);
    await serviceCentrePage.expectContactEmailLinkToBeVisible();

    await serviceCentrePage.expandAccordionSection('Cases heard');
    await serviceCentrePage.expectCasesHeardToBePopulated();
    await serviceCentrePage.expectFirstCaseLinkToOpenInNewTab();
  });

  test('renders the scammers outbound link and empty contacts safely', async ({ serviceCentrePage }) => {
    await serviceCentrePage.goto(serviceCentreData.defaultServiceCentre.slug);
    await serviceCentrePage.expectOutboundLinkToHaveAttributes(scamLink, {
      target: '_blank',
      rel: 'noreferrer noopener',
    });

    await serviceCentrePage.goto(serviceCentreData.noContactServiceCentre.slug);
    await serviceCentrePage.expandAccordionSection('Contact details');
    await serviceCentrePage.expectContactTableCount(0);
  });

  test('renders localized closed and not-found pages', async ({ serviceCentrePage }) => {
    await serviceCentrePage.goto(serviceCentreData.closedServiceCentre.slug, 'en');
    await serviceCentrePage.expectHeadingToHaveText(serviceCentreData.closedServiceCentre.name);
    await serviceCentrePage.expectMainContentToContainText('This service centre is no longer in service.');
    await serviceCentrePage.expectMainContentToContainText(
      'Search for an alternative court, tribunal or service centre'
    );

    const response = await serviceCentrePage.goto('not-a-real-service-centre', 'cy');
    expect(response?.status()).toBe(404);
    await serviceCentrePage.expectHeadingToContainText("Ni ellir dod o hyd i'r dudalen");
  });
});
