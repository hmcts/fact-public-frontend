import { expect, test } from '@playwright/test';
import { DateTime } from 'luxon';

import { CourtTestData, createCourtTestData } from '../helpers/courtTestData';
import { hasText, isCounterServiceOpeningHoursLabel, isPhoneLikeValue } from '../helpers/courtTestUtils';
import { CourtPage } from '../page-objects/CourtPage';

type CourtAddress = CourtTestData['defaultCourt']['body']['courtAddresses'][number];

const SECTION_HEADINGS = {
  addressEn: 'Address',
  addressCy: 'Cyfeiriad',
  openingHoursEn: 'Opening hours',
  openingHoursCy: 'Oriau agor',
} as const;

test.describe('Court Page Addresses And Opening Hours', () => {
  let courtData: CourtTestData;

  test.beforeAll(async ({ playwright }) => {
    courtData = await createCourtTestData(playwright, 'Addresses');
  });

  test.afterAll(async () => {
    await courtData.cleanup();
  });

  test('should verify "Address" section content', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.defaultCourt.slug);
    if (courtData.defaultCourt.body.courtAddresses.length > 0) {
      for (const address of courtData.defaultCourt.body.courtAddresses as CourtAddress[]) {
        const addressTypeMap = {
          WRITE_TO_US: 'Send documents to',
          VISIT_US: 'Visit',
          VISIT_OR_CONTACT_US: 'Visit and send documents to',
        };
        await courtPage.expectStaticSectionContent(SECTION_HEADINGS.addressEn, addressTypeMap[address.addressType]);
        await courtPage.expectStaticSectionContent(SECTION_HEADINGS.addressEn, address.addressLine1);
        await courtPage.expectStaticSectionContent(SECTION_HEADINGS.addressEn, address.addressLine2);
        await courtPage.expectStaticSectionContent(SECTION_HEADINGS.addressEn, address.townCity);
        await courtPage.expectStaticSectionContent(SECTION_HEADINGS.addressEn, address.county);
        await courtPage.expectStaticSectionContent(SECTION_HEADINGS.addressEn, address.postcode);
      }
    }
  });

  test('should verify "Address" "Cyfeiriad" section content in Welsh', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.defaultCourt.slug, 'cy');
    if (courtData.defaultCourt.body.courtAddresses.length > 0) {
      for (const address of courtData.defaultCourt.body.courtAddresses as CourtAddress[]) {
        const addressTypeMap = {
          VISIT_US: 'Ewch i',
          WRITE_TO_US: 'Anfonwch y dogfennau i',
          VISIT_OR_CONTACT_US: 'Ewch i ac anfonwch ddogfennau i',
        };
        await courtPage.expectStaticSectionContent(SECTION_HEADINGS.addressCy, addressTypeMap[address.addressType]);
        await courtPage.expectStaticSectionContent(SECTION_HEADINGS.addressCy, address.addressLine1);
        await courtPage.expectStaticSectionContent(SECTION_HEADINGS.addressCy, address.addressLine2);
        await courtPage.expectStaticSectionContent(SECTION_HEADINGS.addressCy, address.townCity);
        await courtPage.expectStaticSectionContent(SECTION_HEADINGS.addressCy, address.county);
        await courtPage.expectStaticSectionContent(SECTION_HEADINGS.addressCy, address.postcode);
      }
    }
  });

  test('should render directions links for visit addresses', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.defaultCourt.slug);

    const visitAddresses = courtData.defaultCourt.body.courtAddresses.filter(
      address => address.addressType === 'VISIT_US' && address.lat !== null && address.lon !== null
    );

    if (visitAddresses.length > 0) {
      const directionsLinks = page.locator('#addresses a[href^="https://www.google.com/maps?q="]');
      await expect(directionsLinks).toHaveCount(visitAddresses.length);

      for (let index = 0; index < visitAddresses.length; index += 1) {
        await expect(directionsLinks.nth(index)).toHaveAttribute('target', '_blank');
        await expect(directionsLinks.nth(index)).toHaveAttribute('rel', 'noopener noreferrer');
      }
    }
  });

  test('should render address tags when areas of law or court types are present', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.defaultCourt.slug);

    for (const address of courtData.defaultCourt.body.courtAddresses) {
      const tags = [...address.areasOfLaw, ...address.courtTypes].map(item => item.name).filter(hasText);
      for (const tag of tags) {
        await courtPage.expectStaticSectionContent(SECTION_HEADINGS.addressEn, tag);
      }
    }
  });

  test('should render addresses in the expected priority order', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.defaultCourt.slug);

    const rank = { VISIT_US: 0, VISIT_OR_CONTACT_US: 1, WRITE_TO_US: 2 };
    const labelMap = {
      VISIT_US: 'Visit',
      VISIT_OR_CONTACT_US: 'Visit and send documents to',
      WRITE_TO_US: 'Send documents to',
    };
    const expectedOrder = [...courtData.defaultCourt.body.courtAddresses]
      .sort((first, second) => (rank[first.addressType] ?? 10) - (rank[second.addressType] ?? 10))
      .map(address => labelMap[address.addressType]);

    const addressLabels = page.locator('#addresses .govuk-summary-list__key');
    for (const [index, label] of expectedOrder.entries()) {
      await expect(addressLabels.nth(index)).toContainText(label);
    }
  });

  test('should verify "Opening hours" section content', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.defaultCourt.slug);
    await courtPage.expectOpeningHoursToBeVisible();
    if (courtData.defaultCourt.body.courtOpeningHours.length > 0) {
      await courtPage.expectStaticSectionContent(
        SECTION_HEADINGS.openingHoursEn,
        DateTime.fromFormat(
          courtData.defaultCourt.body.courtOpeningHours[0].openingTimesDetails[0].openingTime,
          'HH:mm:ss',
          {
            zone: 'Europe/London',
          }
        )
          .toFormat('h:mma')
          .toLowerCase()
      );
      await courtPage.expectStaticSectionContent(
        SECTION_HEADINGS.openingHoursEn,
        DateTime.fromFormat(
          courtData.defaultCourt.body.courtOpeningHours[0].openingTimesDetails[0].closingTime,
          'HH:mm:ss',
          {
            zone: 'Europe/London',
          }
        )
          .toFormat('h:mma')
          .toLowerCase()
      );
    }
  });

  test('should verify "Opening hours" "Oriau agor" section in Welsh', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.defaultCourt.slug, 'cy');
    if (courtData.defaultCourt.body.courtOpeningHours.length > 0) {
      await courtPage.expectStaticSectionContent(
        SECTION_HEADINGS.openingHoursCy,
        DateTime.fromFormat(
          courtData.defaultCourt.body.courtOpeningHours[0].openingTimesDetails[0].openingTime,
          'HH:mm:ss',
          {
            zone: 'Europe/London',
          }
        )
          .toFormat('h:mma')
          .toLowerCase()
      );
      await courtPage.expectStaticSectionContent(
        SECTION_HEADINGS.openingHoursCy,
        DateTime.fromFormat(
          courtData.defaultCourt.body.courtOpeningHours[0].openingTimesDetails[0].closingTime,
          'HH:mm:ss',
          {
            zone: 'Europe/London',
          }
        )
          .toFormat('h:mma')
          .toLowerCase()
      );
    }
  });

  test('should verify counter service content in opening hours when present', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.defaultCourt.slug);

    if (courtData.defaultCourt.body.courtCounterServiceOpeningHours.length === 0) {
      return;
    }

    const counterService = courtData.defaultCourt.body.courtCounterServiceOpeningHours[0];
    const hasHelpItems =
      counterService.assistWithForms || counterService.assistWithDocuments || counterService.assistWithSupport;
    const hasOpeningTimes = counterService.openingTimesDetails.length > 0;

    if (!hasHelpItems && !hasOpeningTimes) {
      return;
    }

    if (hasHelpItems) {
      const counterServiceTypeNames = (counterService.courtTypes ?? [])
        .map(courtType => courtType.name)
        .filter(hasText);
      const expectedTitle =
        counterServiceTypeNames.length > 0
          ? `Counter service for ${counterServiceTypeNames.join(', ')}`
          : 'Counter service';
      await courtPage.expectStaticSectionContent(SECTION_HEADINGS.openingHoursEn, expectedTitle);
      await courtPage.expectStaticSectionContent(SECTION_HEADINGS.openingHoursEn, 'Get help about:');

      if (counterService.assistWithForms) {
        await courtPage.expectStaticSectionContent(SECTION_HEADINGS.openingHoursEn, 'Forms');
      }
      if (counterService.assistWithDocuments) {
        await courtPage.expectStaticSectionContent(SECTION_HEADINGS.openingHoursEn, 'Documents');
      }
      if (counterService.assistWithSupport) {
        await courtPage.expectStaticSectionContent(SECTION_HEADINGS.openingHoursEn, 'Support available at court');
      }

      if (counterService.appointmentNeeded) {
        await courtPage.expectStaticSectionContent(SECTION_HEADINGS.openingHoursEn, 'Available by appointment only.');
        if (hasText(counterService.appointmentContact)) {
          await courtPage.expectStaticSectionContent(
            SECTION_HEADINGS.openingHoursEn,
            counterService.appointmentContact
          );
          if (isPhoneLikeValue(counterService.appointmentContact)) {
            await courtPage.expectStaticSectionLinkToHaveAttributes(
              SECTION_HEADINGS.openingHoursEn,
              counterService.appointmentContact,
              {
                href: `tel:${counterService.appointmentContact}`,
              }
            );
          }
        }
      } else {
        await courtPage.expectStaticSectionContent(SECTION_HEADINGS.openingHoursEn, 'You do not need an appointment.');
      }
    }

    if (hasOpeningTimes) {
      await courtPage.expectStaticSectionContent(SECTION_HEADINGS.openingHoursEn, 'Counter open');
      for (const entry of counterService.openingTimesDetails) {
        await courtPage.expectStaticSectionContent(
          SECTION_HEADINGS.openingHoursEn,
          DateTime.fromFormat(entry.openingTime, 'HH:mm:ss', { zone: 'Europe/London' }).toFormat('h:mma').toLowerCase()
        );
        await courtPage.expectStaticSectionContent(
          SECTION_HEADINGS.openingHoursEn,
          DateTime.fromFormat(entry.closingTime, 'HH:mm:ss', { zone: 'Europe/London' }).toFormat('h:mma').toLowerCase()
        );
      }
    }
  });

  test('should render opening hour groups in alphabetical order', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.defaultCourt.slug);

    const renderedLabels = await page.locator('#opening-hours .govuk-summary-list__key').allTextContents();
    const normalizedRenderedLabels = renderedLabels
      .map(label => label.trim())
      .filter(hasText)
      .filter(label => !isCounterServiceOpeningHoursLabel(label));

    const sortedRenderedLabels = [...normalizedRenderedLabels].sort((first, second) =>
      first.localeCompare(second, undefined, { sensitivity: 'base' })
    );

    expect(normalizedRenderedLabels).toEqual(sortedRenderedLabels);
  });
});
