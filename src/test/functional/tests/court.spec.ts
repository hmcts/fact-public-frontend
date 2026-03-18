import { expect, test } from '@playwright/test';
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
    console.log(responseBody);
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

  test('should toggle language between English and Welsh', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug);
    await courtPage.expectLanguageLinkToContainText('Cymraeg');

    await page.click('a.fact-language');
    await courtPage.expectLanguageLinkToContainText('English');

    await page.waitForURL(/lng=cy/);
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
      for (const address of responseBody.courtAddresses) {
        const addressTypeMap = {
          'WRITE_TO_US': 'Send documents to',
          'VISIT_US': 'Visit',
          'VISIT_OR_CONTACT_US': 'Visit and send documents to',
        };
        await courtPage.expectStaticSectionContent('Address', addressTypeMap[address.addressType]);
        await courtPage.expectStaticSectionContent('Address', address.addressLine1);
        await courtPage.expectStaticSectionContent('Address', address.addressLine2);
        await courtPage.expectStaticSectionContent('Address', address.townCity);
        await courtPage.expectStaticSectionContent('Address', address.county);
        await courtPage.expectStaticSectionContent('Address', address.postcode);
      }
    }
  });

  test('should verify "Address" "Cyfeiriad" section content in Welsh', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug, 'cy');
    if (responseBody.courtAddresses.length > 0) {
      for (const address of responseBody.courtAddresses) {
        const addressTypeMap = {
          VISIT_US: 'Ewch i',
          WRITE_TO_US: 'Anfonwch y dogfennau i',
          VISIT_OR_CONTACT_US: 'Ewch i ac anfonwch ddogfennau i',
        };
        await courtPage.expectStaticSectionContent('Cyfeiriad', addressTypeMap[address.addressType]);
        await courtPage.expectStaticSectionContent('Cyfeiriad', address.addressLine1);
        await courtPage.expectStaticSectionContent('Cyfeiriad', address.addressLine2);
        await courtPage.expectStaticSectionContent('Cyfeiriad', address.townCity);
        await courtPage.expectStaticSectionContent('Cyfeiriad', address.county);
        await courtPage.expectStaticSectionContent('Cyfeiriad', address.postcode);
      }
    }
  });

  test('should verify "Opening hours" section content', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug);
    await courtPage.expectOpeningHoursToBeVisible();
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

  test('should verify "Opening hours" "Oriau agor" section in Welsh', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug, 'cy');
    if (responseBody.courtOpeningHours.length > 0) {
      await courtPage.expectStaticSectionContent(
        'Oriau agor',
        DateTime.fromFormat(responseBody.courtOpeningHours[0].openingTimesDetails[0].openingTime, 'HH:mm:ss', {
          zone: 'Europe/London',
        })
          .toFormat('h:mma')
          .toLowerCase()
      );
      await courtPage.expectStaticSectionContent(
        'Oriau agor',
        DateTime.fromFormat(responseBody.courtOpeningHours[0].openingTimesDetails[0].closingTime, 'HH:mm:ss', {
          zone: 'Europe/London',
        })
          .toFormat('h:mma')
          .toLowerCase()
      );
    }
  });

  test('should verify photo renders correctly', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug);
    if (responseBody.courtPhotos.length > 0) {
      await courtPage.expectCourtPhotoToBeVisible(responseBody.courtPhotos[0].fileLink, courtName);
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

  test('should verify "Useful Information" "Gwybodaeth ddefnyddiol" section content in Welsh', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug, 'cy');
    await courtPage.expectStaticSectionContent(
      'Gwybodaeth ddefnyddiol',
      "Gwybodaeth am beth i’w ddisgwyl wrth ddod i lys neu dribiwnlys (yn agor mewn tab newydd), gan gynnwys yr hyn y dylech ddod â chi, pryd i gyrraedd, beth i'w wisgo, beth i'w ddisgwyl ar y diwrnod a pha gefnogaeth sydd ar gael."
    );
    await courtPage.expectStaticSectionContent(
      'Gwybodaeth ddefnyddiol',
      "Dewch o hyd i wybodaeth am wrandawiadau ac achosion gweithdrefn un ynad yn y llys hwn (yn agor mewn tab newydd), gan gynnwys amser, lleoliad, math o achos a gwrandawiad, teitl trosedd ac enw'r erlynydd."
    );
    await courtPage.expectStaticSectionContent(
      'Gwybodaeth ddefnyddiol',
      "Mae rhai sgamwyr yn cogio eu bod yn gweithio i GLlTEF neu'r adran orfodaeth."
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

  test('should open all accordion sections when "Show all sections" button is clicked', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug);

    await courtPage.clickShowAllSections();

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
      await courtPage.expectAccordionSectionExpanded(section);
    }
  });

  test('should close all accordion sections when "Hide all sections" button is clicked', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug);

    await courtPage.clickShowAllSections();
    await courtPage.clickHideAllSections();

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
      await courtPage.expectAccordionSectionCollapsed(section);
    }
  });

  test('should verify "Contact details" section content', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug);
    await courtPage.expandAccordionSection('Contact details');
    if (responseBody.courtContactDetails.length > 0) {
      for (const contactDetail of responseBody.courtContactDetails) {
        if (contactDetail.explanation) {
          await courtPage.expectAccordionSectionContent('Contact details', contactDetail.explanation);
        }
        if (contactDetail.phoneNumber) {
          await courtPage.expectAccordionSectionContent('Contact details', contactDetail.phoneNumber);
        }
        if (contactDetail.email) {
          await courtPage.expectAccordionSectionContent('Contact details', contactDetail.email);
        }
      }
    }
  });

  test('should verify "Contact details" "Manylion cyswllt" section content in Welsh', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug, 'cy');
    await courtPage.expandAccordionSection('Manylion cyswllt');
    if (responseBody.courtContactDetails.length > 0) {
      for (const contactDetail of responseBody.courtContactDetails) {
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
    if (responseBody.courtTranslations.length > 0) {
      await courtPage.expectAccordionSectionContent(
        'Translation and interpretation',
        'If you need a language interpreter, including sign language, contact the court on');
      await courtPage.expectAccordionSectionContent(
        'Translation and interpretation',
         responseBody.courtTranslations[0].phoneNumber);
      await courtPage.expectAccordionSectionContent('Translation and interpretation', responseBody.courtTranslations[0].email);
    }
  });

  test('should verify "Translation and interpretation" "Cyfieithu a chyfieithu ar y pryd" section content in Welsh', async ({
    page,
  }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug, 'cy');
    await courtPage.expandAccordionSection('Cyfieithu a chyfieithu ar y pryd');
    await courtPage.expectAccordionSectionContent(
      'Cyfieithu a chyfieithu ar y pryd',
      'Darganfyddwch fwy o wybodaeth am gael cyfieithydd mewn llys neu dribiwnlys'
    );
    if (responseBody.courtTranslations.length > 0) {
      await courtPage.expectAccordionSectionContent(
        'Cyfieithu a chyfieithu ar y pryd',
        "Os oes angen cyfieithydd iaith arnoch, gan gynnwys iaith arwyddion, cysylltwch â'r llys ar"
      );
      await courtPage.expectAccordionSectionContent(
        'Cyfieithu a chyfieithu ar y pryd',
        responseBody.courtTranslations[0].phoneNumber
      );
      await courtPage.expectAccordionSectionContent(
        'Cyfieithu a chyfieithu ar y pryd',
        responseBody.courtTranslations[0].email
      );
    }
  });

  test('should verify "Accessibility" section content', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug);
    await courtPage.expandAccordionSection('Accessibility');
    if (responseBody.courtAccessibilityOptions.length > 0) {
      if (responseBody.courtAccessibilityOptions[0].accessibleToiletDescription) {
        await courtPage.expectAccordionSectionContent(
          'Accessibility',
          responseBody.courtAccessibilityOptions[0].accessibleToiletDescription
        );
      }

      if (responseBody.courtAccessibilityOptions[0].accessibleParking) {
        await courtPage.expectAccordionSectionContent(
          'Accessibility',
          'Accessible parking is available.');
        await courtPage.expectAccordionSectionContent(
          'Accessibility',
          responseBody.courtAccessibilityOptions[0].accessibleParkingContact);
      } else {
        await courtPage.expectAccordionSectionContent(
          'Accessibility',
          'No accessible parking at the court. Check with the local authority for nearby options.'
        );
      }

      if (responseBody.courtAccessibilityOptions[0].accessibleEntrance) {
        await courtPage.expectAccordionSectionContent(
          'Accessibility',
          'Step free access between the street and the courtrooms.'
        );
        await courtPage.expectAccordionSectionContent(
          'Accessibility',
          responseBody.courtAccessibilityOptions[0].accessibleEntrancePhoneNumber
        );
      } else {
        await courtPage.expectAccordionSectionContent(
          'Accessibility',
          'No step free access between the street and the courtrooms.'
        );
      }

      if (responseBody.courtAccessibilityOptions[0].hearingEnhancementEquipment) {
        const equipmentMap = {
          INFRARED_SYSTEMS_AND_HEARING_LOOP_SYSTEMS: 'Infrared systems and hearing loop systems are available at this court.',
          HEARING_LOOP_SYSTEMS: 'Hearing loop systems are available at this court.',
          INFRARED_SYSTEMS: 'Infrared systems are available at this court.',
        };
        await courtPage.expectAccordionSectionContent(
          'Accessibility',
          equipmentMap[responseBody.courtAccessibilityOptions[0].hearingEnhancementEquipment]
        );
      }

      if (responseBody.courtAccessibilityOptions[0].lift) {
        await courtPage.expectAccordionSectionContent('Accessibility', 'Courtrooms accessible by lift.');
        await courtPage.expectAccordionSectionContent(
          'Accessibility',
          responseBody.courtAccessibilityOptions[0].liftDoorWidth
        );
        await courtPage.expectAccordionSectionContent(
          'Accessibility',
          responseBody.courtAccessibilityOptions[0].liftDoorLimit
        );
        }
      } else {
        await courtPage.expectAccordionSectionContent('Accessibility', 'Lifts are not available.');
      }

      if (responseBody.courtAccessibilityOptions[0].quietRoom) {
        await courtPage.expectAccordionSectionContent(
          'Accessibility',
          'A quiet room is available for people of all faiths or none, for prayer and reflection.'
        );
      } else {
        await courtPage.expectAccordionSectionContent('Accessibility', 'A quiet room is not available.');
      }
  });

  test('should verify "Accessibility" "Hygyrchedd" section content in Welsh', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug, 'cy');
    await courtPage.expandAccordionSection('Hygyrchedd');
    if (responseBody.courtAccessibilityOptions.length > 0) {
      if (responseBody.courtAccessibilityOptions[0].accessibleToiletDescriptionCy) {
        await courtPage.expectAccordionSectionContent(
          'Hygyrchedd',
          responseBody.courtAccessibilityOptions[0].accessibleToiletDescriptionCy
        );
      }

      if (responseBody.courtAccessibilityOptions[0].accessibleParking) {
        await courtPage.expectAccordionSectionContent('Hygyrchedd', 'Mae parcio hygyrch ar gael.');
        await courtPage.expectAccordionSectionContent(
          'Hygyrchedd',
          responseBody.courtAccessibilityOptions[0].accessibleParkingContact
        );
      } else {
        await courtPage.expectAccordionSectionContent(
          'Hygyrchedd',
          'Nid oes parcio hygyrch yn y llys.'
        );
      }

      if (responseBody.courtAccessibilityOptions[0].accessibleEntrance) {
        await courtPage.expectAccordionSectionContent(
          'Hygyrchedd',
          "Mynediad di-risiau rhwng y stryd a'r ystafelloedd llys."
        );
        await courtPage.expectAccordionSectionContent(
          'Hygyrchedd',
          responseBody.courtAccessibilityOptions[0].accessibleEntrancePhoneNumber
        );
      } else {
        await courtPage.expectAccordionSectionContent(
          'Hygyrchedd',
          "Dim mynediad di-risiau rhwng y stryd a'r ystafelloedd llys."
        );
      }

      if (responseBody.courtAccessibilityOptions[0].hearingEnhancementEquipment) {
        const equipmentMap = {
          INFRARED_SYSTEMS_AND_HEARING_LOOP_SYSTEMS: 'Mae systemau isgoch a systemau dolen glyw ar gael yn y llys hwn.',
          HEARING_LOOP_SYSTEMS: 'Mae systemau dolen glyw ar gael yn y llys hwn.',
          INFRARED_SYSTEMS: 'Mae systemau isgoch ar gael yn y llys hwn.',
        };
        await courtPage.expectAccordionSectionContent(
          'Hygyrchedd',
          equipmentMap[responseBody.courtAccessibilityOptions[0].hearingEnhancementEquipment]
        );
      }

      if (responseBody.courtAccessibilityOptions[0].lift) {
        await courtPage.expectAccordionSectionContent(
          'Hygyrchedd',
          "Ystafelloedd llys sy'n hygyrch drwy ddefnyddio lifft."
        );
        await courtPage.expectAccordionSectionContent(
          'Hygyrchedd',
          responseBody.courtAccessibilityOptions[0].liftDoorWidth
        );
        await courtPage.expectAccordionSectionContent(
          'Hygyrchedd',
          responseBody.courtAccessibilityOptions[0].liftDoorLimit
        );
      }
    } else {
      await courtPage.expectAccordionSectionContent('Hygyrchedd', 'Nid oes lifftiau ar gael.');
    }

    if (responseBody.courtAccessibilityOptions[0].quietRoom) {
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
  });

  test('should verify "Building facilities" section content', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto(courtSlug);
    await courtPage.expandAccordionSection('Building facilities');
    if (responseBody.courtFacilities.length > 0) {
      if (responseBody.courtFacilities[0].parking) {
        await courtPage.expectAccordionSectionContent('Building facilities', 'Parking is available.');
      } else {
        await courtPage.expectAccordionSectionContent(
          'Building facilities',
          'No parking at the court. Check online for nearby options.'
        );
      }

      if (responseBody.courtFacilities[0].freeWaterDispensers) {
        await courtPage.expectAccordionSectionContent('Building facilities', 'Free water dispensers');
      }

      if (responseBody.courtFacilities[0].snackVendingMachines) {
        await courtPage.expectAccordionSectionContent('Building facilities', 'Snack vending machines');
      }

      if (responseBody.courtFacilities[0].drinkVendingMachines) {
        await courtPage.expectAccordionSectionContent('Building facilities', 'Drink vending machines');
      }

      if (responseBody.courtFacilities[0].cafeteria) {
        await courtPage.expectAccordionSectionContent('Building facilities', 'A cafeteria serving hot and cold food');
      }

      if (responseBody.courtFacilities[0].waitingArea) {
        await courtPage.expectAccordionSectionContent('Building facilities', 'Separate waiting areas are available.');
      }

      if (responseBody.courtFacilities[0].quietRoom) {
        await courtPage.expectAccordionSectionContent(
          'Building facilities',
          'A quiet room is available for people of all faiths or none, for prayer and reflection.'
        );
      } else {
        await courtPage.expectAccordionSectionContent('Building facilities', 'A quiet room is not available.');
      }

      if (responseBody.courtFacilities[0].babyChanging) {
        await courtPage.expectAccordionSectionContent('Building facilities', 'Baby changing facilities at the court.');
      } else {
        await courtPage.expectAccordionSectionContent(
          'Building facilities',
          'No baby changing facilities at the court. A breastfeeding room is available on request.'
        );
      }

      if (responseBody.courtFacilities[0].wifi) {
        await courtPage.expectAccordionSectionContent('Building facilities', 'WiFi is available.');
      } else {
        await courtPage.expectAccordionSectionContent('Building facilities', 'No WiFi at the court.');
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

  test('Closed-court page is rendered when the retrieved court is closed', async ({ page }) => {
    const closedCourtResponse = await apiContext.get('/testing-support/courts', {
      params: {
        courtName: 'Test Closed Court' + generateRandomString(),
        serviceCenter: false,
        open: false,
      },
    });
    const closedCourtResponseBody = await closedCourtResponse.json();
    const closedCourtSlug = closedCourtResponseBody.slug;
    const courtPage = new CourtPage(page);
    await courtPage.goto(closedCourtSlug);
    await courtPage.expectHeadingToContainText(closedCourtResponseBody.name);
    await courtPage.expectMainContentToContainText(
      'This court or tribunal is no longer in service. Business has been transferred to other neighbouring courts.'
    );
    await apiContext.delete(`/testing-support/courts/name-prefix/${closedCourtResponseBody.name}`);
  });

  test('Not found page is rendered when the court does not exist', async ({ page }) => {
    const courtPage = new CourtPage(page);
    await courtPage.goto('not-a-real-slug');
    const sectionContent= page.locator('h1.govuk-heading-xl');
    await expect(sectionContent).toContainText('Page Not Found');
    await courtPage.expectMainContentToContainText('If you typed the web address, check it is correct.');
    await courtPage.expectMainContentToContainText('If you pasted the web address, check you copied the entire address.');
  });
});
