import { expect, test } from '@playwright/test';

import { CourtTestData, createCourtTestData } from '../helpers/courtTestData';
import { getContactName, getEnquiriesPhoneNumber, hasText, isPhoneLikeValue } from '../helpers/courtTestUtils';
import { CourtPage } from '../page-objects/CourtPage';

const SECTION_HEADINGS = {
  usefulInformationEn: 'Useful Information',
  usefulInformationCy: 'Gwybodaeth ddefnyddiol',
  contactDetailsEn: 'Contact details',
  contactDetailsCy: 'Manylion cyswllt',
  casesHeardEn: 'Cases heard',
  translationEn: 'Translation and interpretation',
  translationCy: 'Cyfieithu a chyfieithu ar y pryd',
  accessibilityEn: 'Accessibility',
  accessibilityCy: 'Hygyrchedd',
  buildingFacilities: 'Building facilities',
  professionals: 'Information for professionals',
  complaintEn: 'Make a complaint',
  complaintCy: 'Gwneud cwyn',
} as const;

const ACCORDION_SECTIONS = [
  SECTION_HEADINGS.contactDetailsEn,
  SECTION_HEADINGS.casesHeardEn,
  SECTION_HEADINGS.translationEn,
  SECTION_HEADINGS.accessibilityEn,
  SECTION_HEADINGS.buildingFacilities,
  SECTION_HEADINGS.professionals,
  SECTION_HEADINGS.complaintEn,
] as const;

const LINKS = {
  interpreterInfo: 'https://www.gov.uk/get-interpreter-at-court-or-tribunal',
  usefulInfoCourtTribunal: 'https://www.gov.uk/guidance/what-to-expect-coming-to-a-court-or-tribunal',
  usefulInfoHearings: 'https://www.court-tribunal-hearings.service.gov.uk/',
  usefulInfoScams: 'https://www.gov.uk/government/news/scammers-using-hmcts-telephone-numbers',
  complaint: 'https://www.gov.uk/government/organisations/hm-courts-and-tribunals-service/about/complaints-procedure',
} as const;

test.describe('Court Page Accordion Content', () => {
  let courtData: CourtTestData;

  test.beforeAll(async ({ playwright }) => {
    courtData = await createCourtTestData(playwright, 'Accordion');
  });

  test.afterAll(async () => {
    await courtData.cleanup();
  });

  test('should verify "Useful Information" section content', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.defaultCourt.slug);
    await courtPage.expectStaticSectionContent(
      SECTION_HEADINGS.usefulInformationEn,
      'Find information about what to expect coming to a court or tribunal'
    );
    await courtPage.expectStaticSectionContent(
      SECTION_HEADINGS.usefulInformationEn,
      'Find information about hearings and single justice procedure cases at this court'
    );
    await courtPage.expectStaticSectionContent(
      SECTION_HEADINGS.usefulInformationEn,
      'Some scammers are pretending to be from HMCTS or enforcement.'
    );
  });

  test('should verify "Useful Information" section links', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.defaultCourt.slug);
    await courtPage.expectStaticSectionLinkToHaveAttributes(
      SECTION_HEADINGS.usefulInformationEn,
      'Find information about what to expect coming to a court or tribunal (opens in a new tab)',
      {
        href: LINKS.usefulInfoCourtTribunal,
        target: '_blank',
        rel: 'noreferrer noopener',
      }
    );
    await courtPage.expectStaticSectionLinkToHaveAttributes(
      SECTION_HEADINGS.usefulInformationEn,
      'Find information about hearings and single justice procedure cases at this court (opens in a new tab)',
      {
        href: LINKS.usefulInfoHearings,
        target: '_blank',
        rel: 'noreferrer noopener',
      }
    );
    await courtPage.expectStaticSectionLinkToHaveAttributes(
      SECTION_HEADINGS.usefulInformationEn,
      "Find out what to do if you are asked for money and are unsure whether it's genuine (opens in a new tab)",
      {
        href: LINKS.usefulInfoScams,
        target: '_blank',
        rel: 'noreferrer noopener',
      }
    );
  });

  test('should verify "Useful Information" "Gwybodaeth ddefnyddiol" section content in Welsh', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.defaultCourt.slug, 'cy');
    await courtPage.expectStaticSectionContent(
      SECTION_HEADINGS.usefulInformationCy,
      "Gwybodaeth am beth i’w ddisgwyl wrth ddod i lys neu dribiwnlys (yn agor mewn tab newydd), gan gynnwys yr hyn y dylech ddod â chi, pryd i gyrraedd, beth i'w wisgo, beth i'w ddisgwyl ar y diwrnod a pha gefnogaeth sydd ar gael."
    );
    await courtPage.expectStaticSectionContent(
      SECTION_HEADINGS.usefulInformationCy,
      "Dewch o hyd i wybodaeth am wrandawiadau ac achosion gweithdrefn un ynad yn y llys hwn (yn agor mewn tab newydd), gan gynnwys amser, lleoliad, math o achos a gwrandawiad, teitl trosedd ac enw'r erlynydd."
    );
    await courtPage.expectStaticSectionContent(
      SECTION_HEADINGS.usefulInformationCy,
      "Mae rhai sgamwyr yn cogio eu bod yn gweithio i GLlTEF neu'r adran orfodaeth."
    );
  });

  test('should verify "Useful Information" section links in Welsh', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.defaultCourt.slug, 'cy');
    await courtPage.expectStaticSectionLinkToHaveAttributes(
      SECTION_HEADINGS.usefulInformationCy,
      'Gwybodaeth am beth i’w ddisgwyl wrth ddod i lys neu dribiwnlys (yn agor mewn tab newydd)',
      {
        href: LINKS.usefulInfoCourtTribunal,
        target: '_blank',
        rel: 'noreferrer noopener',
      }
    );
    await courtPage.expectStaticSectionLinkToHaveAttributes(
      SECTION_HEADINGS.usefulInformationCy,
      'Dewch o hyd i wybodaeth am wrandawiadau ac achosion gweithdrefn un ynad yn y llys hwn (yn agor mewn tab newydd)',
      {
        href: LINKS.usefulInfoHearings,
        target: '_blank',
        rel: 'noreferrer noopener',
      }
    );
    await courtPage.expectStaticSectionLinkToHaveAttributes(
      SECTION_HEADINGS.usefulInformationCy,
      "Darganfyddwch beth i'w wneud os gofynnir i chi am arian ac nad ydych yn siŵr a yw'n ddilys (yn agor mewn tab newydd)",
      {
        href: LINKS.usefulInfoScams,
        target: '_blank',
        rel: 'noreferrer noopener',
      }
    );
  });

  test('should verify all accordion sections are present', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.defaultCourt.slug);
    for (const section of ACCORDION_SECTIONS) {
      await courtPage.expectAccordionSectionVisible(section);
    }
  });

  test('should open all accordion sections when "Show all sections" button is clicked', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.defaultCourt.slug);
    await courtPage.clickShowAllSections();
    for (const section of ACCORDION_SECTIONS) {
      await courtPage.expectAccordionSectionExpanded(section);
    }
  });

  test('should close all accordion sections when "Hide all sections" button is clicked', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.defaultCourt.slug);
    await courtPage.clickShowAllSections();
    await courtPage.clickHideAllSections();
    for (const section of ACCORDION_SECTIONS) {
      await courtPage.expectAccordionSectionCollapsed(section);
    }
  });

  test('should verify "Contact details" section content', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.defaultCourt.slug);
    await courtPage.expandAccordionSection(SECTION_HEADINGS.contactDetailsEn);
    for (const contactDetail of courtData.defaultCourt.body.courtContactDetails) {
      if (contactDetail.explanation) {
        await courtPage.expectAccordionSectionContent(SECTION_HEADINGS.contactDetailsEn, contactDetail.explanation);
      }
      if (contactDetail.phoneNumber) {
        await courtPage.expectAccordionSectionContent(SECTION_HEADINGS.contactDetailsEn, contactDetail.phoneNumber);
      }
      if (contactDetail.email) {
        await courtPage.expectAccordionSectionContent(SECTION_HEADINGS.contactDetailsEn, contactDetail.email);
      }
    }
  });

  test('should verify "Contact details" section links', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.defaultCourt.slug);
    await courtPage.expandAccordionSection(SECTION_HEADINGS.contactDetailsEn);
    for (const contactDetail of courtData.defaultCourt.body.courtContactDetails) {
      if (contactDetail.phoneNumber) {
        await courtPage.expectAccordionSectionLinkToHaveAttributes(
          SECTION_HEADINGS.contactDetailsEn,
          contactDetail.phoneNumber,
          {
            href: `tel:${contactDetail.phoneNumber}`,
          }
        );
      }
      if (contactDetail.email) {
        await courtPage.expectAccordionSectionLinkToHaveAttributes(
          SECTION_HEADINGS.contactDetailsEn,
          contactDetail.email,
          {
            href: `mailto:${contactDetail.email}`,
          }
        );
      }
    }
  });

  test('should verify "Contact details" section links in Welsh', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.defaultCourt.slug, 'cy');
    await courtPage.expandAccordionSection(SECTION_HEADINGS.contactDetailsCy);
    for (const contactDetail of courtData.defaultCourt.body.courtContactDetails) {
      if (contactDetail.phoneNumber) {
        await courtPage.expectAccordionSectionLinkToHaveAttributes(
          SECTION_HEADINGS.contactDetailsCy,
          contactDetail.phoneNumber,
          {
            href: `tel:${contactDetail.phoneNumber}`,
          }
        );
      }
      if (contactDetail.email) {
        await courtPage.expectAccordionSectionLinkToHaveAttributes(
          SECTION_HEADINGS.contactDetailsCy,
          contactDetail.email,
          {
            href: `mailto:${contactDetail.email}`,
          }
        );
      }
    }
  });

  test('should order contact details with enquiries first in English and Welsh', async ({ page }) => {
    const courtPage = new CourtPage(page);
    const contactsWithNames = courtData.defaultCourt.body.courtContactDetails
      .map(contact => ({ contact, names: getContactName(contact) }))
      .filter(item => item.names !== null);
    const englishExpectedOrder = [
      ...contactsWithNames.filter(item => item.names.name.toLowerCase() === 'enquiries').map(item => item.names.name),
      ...contactsWithNames
        .filter(item => item.names.name.toLowerCase() !== 'enquiries')
        .sort((first, second) => first.names.name.localeCompare(second.names.name))
        .map(item => item.names.name),
    ];
    const welshExpectedOrder = [
      ...contactsWithNames.filter(item => item.names.name.toLowerCase() === 'enquiries').map(item => item.names.nameCy),
      ...contactsWithNames
        .filter(item => item.names.name.toLowerCase() !== 'enquiries')
        .sort((first, second) => first.names.nameCy.localeCompare(second.names.nameCy))
        .map(item => item.names.nameCy),
    ];

    await courtPage.goto(courtData.defaultCourt.slug);
    await courtPage.clickShowAllSections();
    const englishCaptions = page.locator('#contact-details .govuk-table__caption');
    for (const [index, caption] of englishExpectedOrder.entries()) {
      await expect(englishCaptions.nth(index)).toContainText(caption);
    }

    await courtPage.goto(courtData.defaultCourt.slug, 'cy');
    await courtPage.clickShowAllSections();
    const welshCaptions = page.locator('#contact-details .govuk-table__caption');
    for (const [index, caption] of welshExpectedOrder.entries()) {
      await expect(welshCaptions.nth(index)).toContainText(caption);
    }
  });

  test('should verify "Contact details" "Manylion cyswllt" section content in Welsh', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.defaultCourt.slug, 'cy');
    await courtPage.expandAccordionSection('Manylion cyswllt');
    for (const contactDetail of courtData.defaultCourt.body.courtContactDetails) {
      if (contactDetail.explanationCy) {
        await courtPage.expectAccordionSectionContent('Manylion cyswllt', contactDetail.explanationCy);
      }
      if (contactDetail.phoneNumber) {
        await courtPage.expectAccordionSectionContent('Manylion cyswllt', contactDetail.phoneNumber);
      }
      if (contactDetail.email) {
        await courtPage.expectAccordionSectionContent('Manylion cyswllt', contactDetail.email);
      }
    }
  });

  test('should verify "Cases heard" section content', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.defaultCourt.slug);
    await courtPage.expandAccordionSection('Cases heard');
    await courtPage.expectAccordionSectionContent('Cases heard', 'The types of cases that are heard at this location');
  });

  test('should verify "Cases heard" section renders list items and outbound links in English and Welsh', async ({
    page,
  }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.defaultCourt.slug);
    await courtPage.expandAccordionSection('Cases heard');
    const englishItems = page.locator('#cases-heard li');
    if (courtData.defaultCourt.body.courtAreasOfLaw.length > 0) {
      await expect(englishItems.first()).toBeVisible();
    }
    const englishLinks = page.locator('#cases-heard a');
    for (let index = 0; index < (await englishLinks.count()); index += 1) {
      await expect(englishLinks.nth(index)).toHaveAttribute('target', '_blank');
      await expect(englishLinks.nth(index)).toHaveAttribute('rel', 'noreferrer noopener');
    }

    await courtPage.goto(courtData.defaultCourt.slug, 'cy');
    await courtPage.clickShowAllSections();
    const welshItems = page.locator('#cases-heard li');
    if (courtData.defaultCourt.body.courtAreasOfLaw.length > 0) {
      await expect(welshItems.first()).toBeVisible();
    }
    const welshLinks = page.locator('#cases-heard a');
    for (let index = 0; index < (await welshLinks.count()); index += 1) {
      await expect(welshLinks.nth(index)).toHaveAttribute('target', '_blank');
      await expect(welshLinks.nth(index)).toHaveAttribute('rel', 'noreferrer noopener');
    }
  });

  test('should verify "Translation and interpretation" section content', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.translationCourt.slug);
    await courtPage.expandAccordionSection('Translation and interpretation');
    await courtPage.expectAccordionSectionContent(
      'Translation and interpretation',
      'Find out more information about getting an interpreter at a court or tribunal (opens in a new tab).'
    );
    expect(courtData.translationCourt.body.courtTranslations.length).toBeGreaterThan(0);
    await courtPage.expectAccordionSectionContent(
      'Translation and interpretation',
      'If you need a language interpreter, including sign language, contact the court on'
    );
    if (hasText(courtData.translationCourt.body.courtTranslations[0].phoneNumber)) {
      await courtPage.expectAccordionSectionContent(
        'Translation and interpretation',
        courtData.translationCourt.body.courtTranslations[0].phoneNumber
      );
    }
    if (hasText(courtData.translationCourt.body.courtTranslations[0].email)) {
      await courtPage.expectAccordionSectionContent(
        'Translation and interpretation',
        courtData.translationCourt.body.courtTranslations[0].email
      );
    }
  });

  test('should verify "Translation and interpretation" section links', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.translationCourt.slug);
    await courtPage.expandAccordionSection('Translation and interpretation');
    await courtPage.expectAccordionSectionLinkToHaveAttributes(
      'Translation and interpretation',
      'Find out more information about getting an interpreter at a court or tribunal (opens in a new tab)',
      {
        href: 'https://www.gov.uk/get-interpreter-at-court-or-tribunal',
        target: '_blank',
        rel: 'noreferrer noopener',
      }
    );
    if (hasText(courtData.translationCourt.body.courtTranslations[0].phoneNumber)) {
      await courtPage.expectAccordionSectionLinkToHaveAttributes(
        'Translation and interpretation',
        courtData.translationCourt.body.courtTranslations[0].phoneNumber,
        { href: `tel:${courtData.translationCourt.body.courtTranslations[0].phoneNumber}` }
      );
    }
    if (hasText(courtData.translationCourt.body.courtTranslations[0].email)) {
      await courtPage.expectAccordionSectionLinkToHaveAttributes(
        'Translation and interpretation',
        courtData.translationCourt.body.courtTranslations[0].email,
        { href: `mailto:${courtData.translationCourt.body.courtTranslations[0].email}` }
      );
    }
  });

  test('should verify "Translation and interpretation" "Cyfieithu a chyfieithu ar y pryd" section content in Welsh', async ({
    page,
  }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.translationCourt.slug, 'cy');
    await courtPage.expandAccordionSection('Cyfieithu a chyfieithu ar y pryd');
    await courtPage.expectAccordionSectionContent(
      'Cyfieithu a chyfieithu ar y pryd',
      'Darganfyddwch fwy o wybodaeth am gael cyfieithydd mewn llys neu dribiwnlys'
    );
    await courtPage.expectAccordionSectionContent(
      'Cyfieithu a chyfieithu ar y pryd',
      "Os oes angen cyfieithydd iaith arnoch, gan gynnwys iaith arwyddion, cysylltwch â'r llys ar"
    );
  });

  test('should verify "Translation and interpretation" section links in Welsh', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.translationCourt.slug, 'cy');
    await courtPage.expandAccordionSection('Cyfieithu a chyfieithu ar y pryd');
    await courtPage.expectAccordionSectionLinkToHaveAttributes(
      'Cyfieithu a chyfieithu ar y pryd',
      'Darganfyddwch fwy o wybodaeth am gael cyfieithydd mewn llys neu dribiwnlys (yn agor mewn tab newydd)',
      {
        href: 'https://www.gov.uk/get-interpreter-at-court-or-tribunal',
        target: '_blank',
        rel: 'noreferrer noopener',
      }
    );
    if (hasText(courtData.translationCourt.body.courtTranslations[0].phoneNumber)) {
      await courtPage.expectAccordionSectionLinkToHaveAttributes(
        'Cyfieithu a chyfieithu ar y pryd',
        courtData.translationCourt.body.courtTranslations[0].phoneNumber,
        { href: `tel:${courtData.translationCourt.body.courtTranslations[0].phoneNumber}` }
      );
    }
    if (hasText(courtData.translationCourt.body.courtTranslations[0].email)) {
      await courtPage.expectAccordionSectionLinkToHaveAttributes(
        'Cyfieithu a chyfieithu ar y pryd',
        courtData.translationCourt.body.courtTranslations[0].email,
        { href: `mailto:${courtData.translationCourt.body.courtTranslations[0].email}` }
      );
    }
  });

  test('should not render translation contact details when translations were not requested', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.noTranslationCourt.slug);
    await courtPage.expandAccordionSection('Translation and interpretation');
    expect(courtData.noTranslationCourt.body.courtTranslations).toHaveLength(0);
    await courtPage.expectAccordionSectionContent(
      'Translation and interpretation',
      'Find out more information about getting an interpreter at a court or tribunal (opens in a new tab).'
    );
    await expect(page.locator('#translation-interpretation .phone-link')).toHaveCount(0);
    await expect(page.locator('#translation-interpretation a[href^="mailto:"]')).toHaveCount(0);
    await expect(page.locator('#translation-interpretation')).not.toContainText(
      'If you need a language interpreter, including sign language, contact the court on'
    );
  });

  test('should verify "Accessibility" section content', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.defaultCourt.slug);
    await courtPage.expandAccordionSection('Accessibility');
    if (courtData.defaultCourt.body.courtAccessibilityOptions.length > 0) {
      const options = courtData.defaultCourt.body.courtAccessibilityOptions[0];
      if (options.accessibleToiletDescription) {
        await courtPage.expectAccordionSectionContent('Accessibility', options.accessibleToiletDescription);
      }
      if (options.accessibleParking) {
        await courtPage.expectAccordionSectionContent('Accessibility', 'Accessible parking is available.');
        if (options.accessibleParkingPhoneNumber) {
          await courtPage.expectAccordionSectionContent('Accessibility', options.accessibleParkingPhoneNumber);
        }
      } else {
        await courtPage.expectAccordionSectionContent(
          'Accessibility',
          'No accessible parking at the court. Check with the local authority for nearby options.'
        );
      }
      if (options.accessibleEntrance) {
        await courtPage.expectAccordionSectionContent(
          'Accessibility',
          'Step free access between the street and the courtrooms.'
        );
      } else {
        await courtPage.expectAccordionSectionContent(
          'Accessibility',
          'No step free access between the street and the courtrooms.'
        );
        if (options.accessibleEntrancePhoneNumber) {
          await courtPage.expectAccordionSectionContent('Accessibility', options.accessibleEntrancePhoneNumber);
        }
      }
      if (options.hearingEnhancementEquipment) {
        const equipmentMap = {
          INFRARED_SYSTEMS_AND_HEARING_LOOP_SYSTEMS:
            'Infrared systems and hearing loop systems are available at this court.',
          HEARING_LOOP_SYSTEMS: 'Hearing loop systems are available at this court.',
          INFRARED_SYSTEMS: 'Infrared systems are available at this court.',
        };
        await courtPage.expectAccordionSectionContent(
          'Accessibility',
          equipmentMap[options.hearingEnhancementEquipment]
        );
      }
      if (options.lift) {
        await courtPage.expectAccordionSectionContent('Accessibility', 'Courtrooms accessible by lift.');
        await courtPage.expectAccordionSectionContent('Accessibility', String(options.liftDoorWidth));
        await courtPage.expectAccordionSectionContent('Accessibility', String(options.liftDoorLimit));
      }
      if (options.quietRoom) {
        await courtPage.expectAccordionSectionContent(
          'Accessibility',
          'A quiet room is available for people of all faiths or none, for prayer and reflection.'
        );
      } else {
        await courtPage.expectAccordionSectionContent('Accessibility', 'A quiet room is not available.');
      }
    }
  });

  test('should verify accessibility contact links when phone numbers are present', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.defaultCourt.slug);
    await courtPage.expandAccordionSection('Accessibility');
    if (courtData.defaultCourt.body.courtAccessibilityOptions.length === 0) {
      return;
    }

    const options = courtData.defaultCourt.body.courtAccessibilityOptions[0];
    const enquiriesPhoneNumber = getEnquiriesPhoneNumber(courtData.defaultCourt.body.courtContactDetails);

    if (options.accessibleParking && hasText(options.accessibleParkingPhoneNumber)) {
      await courtPage.expectAccordionSectionLinkToHaveAttributes(
        'Accessibility',
        options.accessibleParkingPhoneNumber,
        {
          href: `tel:${options.accessibleParkingPhoneNumber}`,
        }
      );
    }
    if (!options.accessibleEntrance && hasText(options.accessibleEntrancePhoneNumber)) {
      await courtPage.expectAccordionSectionLinkToHaveAttributes(
        'Accessibility',
        options.accessibleEntrancePhoneNumber,
        {
          href: `tel:${options.accessibleEntrancePhoneNumber}`,
        }
      );
    }
    if (!options.lift && hasText(enquiriesPhoneNumber)) {
      await courtPage.expectAccordionSectionLinkToHaveAttributes('Accessibility', enquiriesPhoneNumber, {
        href: `tel:${enquiriesPhoneNumber}`,
      });
    }
  });

  test('should render accessibility fallback text when enquiries contact was not requested', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.noEnquiriesCourt.slug);
    await courtPage.expandAccordionSection('Accessibility');
    expect(getEnquiriesPhoneNumber(courtData.noEnquiriesCourt.body.courtContactDetails)).toBeNull();
    await expect(page.locator('#accessibility')).toContainText(
      'Contact the court to find out what help you can get at court.'
    );
  });

  test('should verify "Accessibility" "Hygyrchedd" section content in Welsh', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.defaultCourt.slug, 'cy');
    await courtPage.expandAccordionSection('Hygyrchedd');
    if (courtData.defaultCourt.body.courtAccessibilityOptions.length > 0) {
      const options = courtData.defaultCourt.body.courtAccessibilityOptions[0];
      if (options.accessibleToiletDescriptionCy) {
        await courtPage.expectAccordionSectionContent('Hygyrchedd', options.accessibleToiletDescriptionCy);
      }
      if (options.accessibleParking) {
        await courtPage.expectAccordionSectionContent('Hygyrchedd', 'Mae parcio hygyrch ar gael.');
        if (options.accessibleParkingPhoneNumber) {
          await courtPage.expectAccordionSectionContent('Hygyrchedd', options.accessibleParkingPhoneNumber);
        }
      } else {
        await courtPage.expectAccordionSectionContent('Hygyrchedd', 'Nid oes parcio hygyrch yn y llys.');
      }
      if (options.accessibleEntrance) {
        await courtPage.expectAccordionSectionContent(
          'Hygyrchedd',
          "Mynediad di-risiau rhwng y stryd a'r ystafelloedd llys."
        );
      } else {
        await courtPage.expectAccordionSectionContent(
          'Hygyrchedd',
          "Dim mynediad di-risiau rhwng y stryd a'r ystafelloedd llys."
        );
        if (options.accessibleEntrancePhoneNumber) {
          await courtPage.expectAccordionSectionContent('Hygyrchedd', options.accessibleEntrancePhoneNumber);
        }
      }
      if (options.hearingEnhancementEquipment) {
        const equipmentMap = {
          INFRARED_SYSTEMS_AND_HEARING_LOOP_SYSTEMS: 'Mae systemau isgoch a systemau dolen glyw ar gael yn y llys hwn.',
          HEARING_LOOP_SYSTEMS: 'Mae systemau dolen glyw ar gael yn y llys hwn.',
          INFRARED_SYSTEMS: 'Mae systemau isgoch ar gael yn y llys hwn.',
        };
        await courtPage.expectAccordionSectionContent('Hygyrchedd', equipmentMap[options.hearingEnhancementEquipment]);
      }
      if (options.lift) {
        await courtPage.expectAccordionSectionContent(
          'Hygyrchedd',
          "Ystafelloedd llys sy'n hygyrch drwy ddefnyddio lifft."
        );
        await courtPage.expectAccordionSectionContent('Hygyrchedd', String(options.liftDoorWidth));
        await courtPage.expectAccordionSectionContent('Hygyrchedd', String(options.liftDoorLimit));
      }
      if (options.quietRoom) {
        await courtPage.expectAccordionSectionContent(
          'Hygyrchedd',
          'Mae ystafell dawel ar gael i bobl o bob ffydd neu ddim ffydd, ar gyfer gweddio a myfyrio.'
        );
      } else {
        await courtPage.expectAccordionSectionContent(
          'Hygyrchedd',
          'Mae ystafell weddïo/ystafell dawel ar gael yn y llys hwn.'
        );
      }
    }
  });

  test('should verify "Building facilities" section content', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.defaultCourt.slug);
    await courtPage.expandAccordionSection('Building facilities');
    if (courtData.defaultCourt.body.courtFacilities.length > 0) {
      const facilities = courtData.defaultCourt.body.courtFacilities[0];
      if (facilities.parking) {
        await courtPage.expectAccordionSectionContent('Building facilities', 'Parking is available.');
      } else {
        await courtPage.expectAccordionSectionContent(
          'Building facilities',
          'No parking at the court. Check online for nearby options.'
        );
      }
      if (facilities.freeWaterDispensers) {
        await courtPage.expectAccordionSectionContent('Building facilities', 'Free water dispensers');
      }
      if (facilities.snackVendingMachines) {
        await courtPage.expectAccordionSectionContent('Building facilities', 'Snack vending machines');
      }
      if (facilities.drinkVendingMachines) {
        await courtPage.expectAccordionSectionContent('Building facilities', 'Drink vending machines');
      }
      if (facilities.cafeteria) {
        await courtPage.expectAccordionSectionContent('Building facilities', 'A cafeteria serving hot and cold food');
      }
      if (facilities.waitingArea) {
        await courtPage.expectAccordionSectionContent('Building facilities', 'Separate waiting areas are available.');
      }
      if (facilities.waitingAreaChildren) {
        await courtPage.expectAccordionSectionContent(
          'Building facilities',
          "A separate children's waiting area is available."
        );
      }
      if (facilities.quietRoom) {
        await courtPage.expectAccordionSectionContent(
          'Building facilities',
          'A quiet room is available for people of all faiths or none, for prayer and reflection.'
        );
      } else {
        await courtPage.expectAccordionSectionContent('Building facilities', 'A quiet room is not available.');
      }
      if (facilities.babyChanging) {
        await courtPage.expectAccordionSectionContent('Building facilities', 'Baby changing facilities at the court.');
      } else {
        await courtPage.expectAccordionSectionContent(
          'Building facilities',
          'No baby changing facilities at the court. A breastfeeding room is available on request.'
        );
      }
      if (facilities.wifi) {
        await courtPage.expectAccordionSectionContent('Building facilities', 'Wifi is available.');
      } else {
        await courtPage.expectAccordionSectionContent('Building facilities', 'No Wifi at the court.');
      }
      await courtPage.expectAccordionSectionContent(
        'Building facilities',
        'You must go through a security check like you would at an airport.'
      );
      const foodAndDrinkOptions = [
        facilities.freeWaterDispensers,
        facilities.snackVendingMachines,
        facilities.drinkVendingMachines,
        facilities.cafeteria,
      ].filter(Boolean).length;
      if (foodAndDrinkOptions > 1) {
        await courtPage.expectAccordionSectionContent('Building facilities', 'Facilities include:');
      }
    }
  });

  test('should render building facilities fallback text when enquiries contact was not requested', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.noEnquiriesCourt.slug);
    await courtPage.expandAccordionSection('Building facilities');
    expect(getEnquiriesPhoneNumber(courtData.noEnquiriesCourt.body.courtContactDetails)).toBeNull();
    await expect(page.locator('#building-facilities')).toContainText(
      'Contact the court to find out what help you can get at court.'
    );
    await expect(page.locator('#building-facilities .phone-link')).toHaveCount(0);
  });

  test('should verify "Information for professionals" section content', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.defaultCourt.slug);
    await courtPage.expandAccordionSection('Information for professionals');
    if (courtData.defaultCourt.body.courtCodes.length > 0) {
      const code = courtData.defaultCourt.body.courtCodes[0];
      for (const value of [
        code.crownCourtCode,
        code.magistrateCourtCode,
        code.countyCourtCode,
        code.familyCourtCode,
        code.tribunalCode,
      ]) {
        if (value !== null) {
          await courtPage.expectAccordionSectionContent('Information for professionals', String(value));
        }
      }
      if (hasText(code.gbs)) {
        await courtPage.expectAccordionSectionContent('Information for professionals', code.gbs);
      }
    }
    for (const dxCode of courtData.defaultCourt.body.courtDxCodes) {
      await courtPage.expectAccordionSectionContent('Information for professionals', dxCode.dxCode);
      if (hasText(dxCode.explanation)) {
        await courtPage.expectAccordionSectionContent('Information for professionals', dxCode.explanation);
      }
    }
    for (const faxNumber of courtData.defaultCourt.body.courtFaxNumbers) {
      await courtPage.expectAccordionSectionContent('Information for professionals', faxNumber.faxNumber);
      if (hasText(faxNumber.description)) {
        await courtPage.expectAccordionSectionContent('Information for professionals', faxNumber.description);
      }
    }
    if (courtData.defaultCourt.body.courtProfessionalInformation.length > 0) {
      const professionalInformation = courtData.defaultCourt.body.courtProfessionalInformation[0];
      if (professionalInformation.interviewRooms) {
        await courtPage.expectAccordionSectionContent(
          'Information for professionals',
          `There are ${professionalInformation.interviewRoomCount} interview rooms available.`
        );
        if (hasText(professionalInformation.interviewPhoneNumber)) {
          await courtPage.expectAccordionSectionContent(
            'Information for professionals',
            professionalInformation.interviewPhoneNumber
          );
          if (isPhoneLikeValue(professionalInformation.interviewPhoneNumber)) {
            await courtPage.expectAccordionSectionLinkToHaveAttributes(
              'Information for professionals',
              professionalInformation.interviewPhoneNumber,
              { href: `tel:${professionalInformation.interviewPhoneNumber}` }
            );
          }
        } else {
          await courtPage.expectAccordionSectionContent(
            'Information for professionals',
            'They do not need to be booked.'
          );
        }
      }
      if (professionalInformation.videoHearings) {
        await courtPage.expectAccordionSectionContent(
          'Information for professionals',
          'Video hearing facilities are available at the court.'
        );
      }
      await courtPage.expectAccordionSectionContent(
        'Information for professionals',
        professionalInformation.commonPlatform
          ? 'This location participates in this scheme.'
          : 'This location does not participate in this scheme.'
      );
      await courtPage.expectAccordionSectionContent(
        'Information for professionals',
        professionalInformation.accessScheme
          ? 'This location participates in this scheme.'
          : 'This location does not participate in this scheme.'
      );
    }
  });

  test('should verify "Make a complaint" section content', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.defaultCourt.slug);
    await courtPage.expandAccordionSection(SECTION_HEADINGS.complaintEn);
    await courtPage.expectAccordionSectionContent(SECTION_HEADINGS.complaintEn, 'Contact us to make a complaint');
  });

  test('should verify "Make a complaint" section link', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.defaultCourt.slug);
    await courtPage.expandAccordionSection(SECTION_HEADINGS.complaintEn);
    await courtPage.expectAccordionSectionLinkToHaveAttributes(
      SECTION_HEADINGS.complaintEn,
      'Contact us to make a complaint (opens in a new tab)',
      {
        href: LINKS.complaint,
        target: '_blank',
        rel: 'noreferrer noopener',
      }
    );
  });

  test('should verify "Make a complaint" section link in Welsh', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtData.defaultCourt.slug, 'cy');
    await courtPage.expandAccordionSection(SECTION_HEADINGS.complaintCy);
    await courtPage.expectAccordionSectionLinkToHaveAttributes(
      SECTION_HEADINGS.complaintCy,
      'Cysylltu â ni i wneud cwyn (yn agor mewn tab newydd)',
      {
        href: LINKS.complaint,
        target: '_blank',
        rel: 'noreferrer noopener',
      }
    );
  });
});
