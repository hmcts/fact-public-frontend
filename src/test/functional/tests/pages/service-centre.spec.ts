import { DateTime } from 'luxon';

import { expect, test } from '../../fixtures';
import { ServiceCentreTestData, createServiceCentreTestData } from '../../helpers/serviceCentreTestData';

const scamLink = 'https://www.gov.uk/government/news/scammers-using-hmcts-telephone-numbers';

test.describe('Service Centre Page', { tag: '@functional' }, () => {
  let serviceCentreData!: ServiceCentreTestData;

  test.beforeAll(async ({ playwright }) => {
    serviceCentreData = await createServiceCentreTestData(playwright, 'service-centre-page');
  });

  test.afterAll(async () => {
    if (serviceCentreData) {
      await serviceCentreData.cleanup();
    }
  });

  test('renders the API-backed English page in the required section order', async ({ page }) => {
    const serviceCentre = serviceCentreData.defaultServiceCentre;
    const expectedDate = DateTime.fromISO(String(serviceCentre.body.lastUpdatedAt), { zone: 'Europe/London' })
      .setLocale('en')
      .toFormat('d LLLL yyyy');

    await page.goto(`/service-centres/${serviceCentre.slug}?lng=en`);

    await expect(page).toHaveTitle(`${serviceCentre.name} - Find a Court or Tribunal - GOV.UK`);
    await expect(page.locator('h1')).toHaveText(serviceCentre.name);
    await expect(page.locator('main')).toContainText(`Page last reviewed: ${expectedDate}`);
    await expect(page.locator('#addresses')).toContainText('Visit and send documents to');
    await expect(page.locator('#useful-information')).toContainText('Scammers');
    await expect(page.locator('.govuk-accordion__section-button')).toContainText(['Contact details', 'Cases heard']);

    const sectionOrder = await page
      .locator('main h1, main #addresses, main #useful-information, main #service-centre-details-accordion')
      .evaluateAll(elements => elements.map(element => element.id || element.tagName.toLowerCase()));
    expect(sectionOrder).toEqual(['h1', 'addresses', 'useful-information', 'service-centre-details-accordion']);

    await expect(page.locator('main')).not.toContainText('Opening hours');
    await expect(page.locator('main')).not.toContainText('Coming to court');
    await expect(page.locator('main')).not.toContainText('Hearings at this court');
    await expect(page.locator('main')).not.toContainText('Translation and interpretation');
    await expect(page.locator('main')).not.toContainText('Accessibility');
    await expect(page.locator('main')).not.toContainText('Building facilities');
    await expect(page.locator('main')).not.toContainText('Information for professionals');
  });

  test('renders Welsh content and switches language', async ({ page }) => {
    const serviceCentre = serviceCentreData.defaultServiceCentre;
    const expectedDate = DateTime.fromISO(String(serviceCentre.body.lastUpdatedAt), { zone: 'Europe/London' })
      .setLocale('cy')
      .toFormat('d LLLL yyyy');

    await page.goto(`/service-centres/${serviceCentre.slug}?lng=en`);
    await expect(page.locator('a.fact-language')).toContainText('Cymraeg');
    await page.locator('a.fact-language').click();
    await page.waitForURL(/lng=cy/);

    await expect(page.locator('main')).toContainText(`Adolygwyd y dudalen hon ddiwethaf ar: ${expectedDate}`);
    await expect(page.locator('#addresses')).toContainText('Ewch i ac anfonwch ddogfennau i');
    await expect(page.locator('#useful-information')).toContainText('Gwybodaeth ddefnyddiol');
    await expect(page.locator('.govuk-accordion__section-button')).toContainText([
      'Manylion cyswllt',
      'Achosion a wrandawyd',
    ]);
    await expect(page.locator('a.fact-language')).toContainText('English');

    await page.getByRole('button', { name: /Achosion a wrandawyd/ }).click();
    await expect(page.locator('#cases-heard li')).not.toHaveCount(0);
    await expect(page.locator('#cases-heard a').first()).toHaveAttribute('target', '_blank');
  });

  test('renders conditional warning notices', async ({ page }) => {
    await page.goto(`/service-centres/${serviceCentreData.defaultServiceCentre.slug}`);
    await expect(page.locator('.govuk-warning-text')).toHaveCount(0);

    await page.goto(`/service-centres/${serviceCentreData.warningNoticeServiceCentre.slug}`);
    await expect(page.locator('.govuk-warning-text')).toContainText(
      String(serviceCentreData.warningNoticeServiceCentre.body.warningNotice)
    );

    const welshWarningNotice = serviceCentreData.warningNoticeServiceCentre.body.warningNoticeCy;
    expect(welshWarningNotice).toBeTruthy();
    await page.goto(`/service-centres/${serviceCentreData.warningNoticeServiceCentre.slug}?lng=cy`);
    await expect(page.locator('.govuk-warning-text')).toContainText(String(welshWarningNotice));
    await expect(page.locator('.govuk-warning-text')).not.toContainText(
      String(serviceCentreData.warningNoticeServiceCentre.body.warningNotice)
    );
  });

  test('starts both accordion sections collapsed and expands contact and case content', async ({ page }) => {
    const serviceCentre = serviceCentreData.defaultServiceCentre;
    await page.goto(`/service-centres/${serviceCentre.slug}?lng=en`);

    const buttons = page.locator('.govuk-accordion__section-button');
    await expect(buttons).toHaveCount(2);
    await expect(buttons.nth(0)).toHaveAttribute('aria-expanded', 'false');
    await expect(buttons.nth(1)).toHaveAttribute('aria-expanded', 'false');

    await buttons.nth(0).click();
    await expect(page.locator('#contact-details table')).toHaveCount(1);
    await expect(page.locator('#contact-details .phone-text')).toBeVisible();
    await expect(page.locator('#contact-details a[href^="tel:"]')).toHaveCount(1);
    await expect(page.locator('#contact-details a[href^="mailto:"]')).toBeVisible();

    await buttons.nth(1).click();
    await expect(page.locator('#cases-heard li')).not.toHaveCount(0);
    await expect(page.locator('#cases-heard a').first()).toHaveAttribute('target', '_blank');
  });

  test('renders the scammers outbound link and empty contacts safely', async ({ page }) => {
    await page.goto(`/service-centres/${serviceCentreData.defaultServiceCentre.slug}`);
    const scammers = page.locator(`#useful-information a[href="${scamLink}"]`);
    await expect(scammers).toHaveAttribute('target', '_blank');
    await expect(scammers).toHaveAttribute('rel', 'noreferrer noopener');

    await page.goto(`/service-centres/${serviceCentreData.noContactServiceCentre.slug}`);
    await page.getByRole('button', { name: /Contact details/ }).click();
    await expect(page.locator('#contact-details table')).toHaveCount(0);
  });

  test('renders localized closed and not-found pages', async ({ page }) => {
    await page.goto(`/service-centres/${serviceCentreData.closedServiceCentre.slug}?lng=en`);
    await expect(page.locator('h1')).toHaveText(serviceCentreData.closedServiceCentre.name);
    await expect(page.locator('main')).toContainText('This service centre is no longer in service.');
    await expect(page.locator('main')).toContainText('Search for an alternative court, tribunal or service centre');

    const response = await page.goto('/service-centres/not-a-real-service-centre?lng=cy');
    expect(response?.status()).toBe(404);
    await expect(page.locator('h1')).toContainText("Ni ellir dod o hyd i'r dudalen");
  });
});
