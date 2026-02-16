import { env } from '../helpers/nunjucksEnv';

const i18n = require('../../../../main/locales/en/court.json');

describe('Court page', () => {
  test('renders court page with main heading', () => {
    const court = {
      name: 'Test Court',
      lastUpdatedAt: '1 January 2024',
      warningNotice: null,
      courtAddresses: [
        {
          addressType: 'VISIT_US',
          formattedAddressLines: ['Line 1', 'Town', 'AB1 2CD'],
          formattedAddressTags: [],
          directionsUrl: null,
        },
      ],
      openingHoursByType: [],
      courtPhotos: [],
      courtAreasOfLaw: [],
      courtContactDetails: [],
      courtTranslations: [],
      courtAccessibilityOptions: [],
      courtFacilities: [],
      courtCodes: [],
      courtProfessionalInformation: [],
      courtDxCodes: [],
      courtFaxNumbers: [],
      enquiriesPhoneNumber: null,
    };

    const html = env.render('court.njk', {
      court,
      pageTitleSuffix: i18n.pageTitleSuffix,
      pageLastReviewed: i18n.pageLastReviewed,
      addresses: i18n.addresses,
      openingHours: i18n.openingHours,
      usefulInformation: i18n.usefulInformation,
      translationAndInterpretation: i18n.translationAndInterpretation,
      informationForProfessionals: i18n.informationForProfessionals,
      casesHeard: i18n.casesHeard,
      contactDetails: i18n.contactDetails,
      accessibility: i18n.accessibility,
      buildingFacilities: i18n.buildingFacilities,
      accordion: i18n.accordion,
      htmlLang: 'en',
    });

    expect(html).toContain('Test Court');
    expect(html).toContain(i18n.accordion.contactDetailsHeading);
    expect(html).toContain(i18n.accordion.casesHeardHeading);
  });
});
