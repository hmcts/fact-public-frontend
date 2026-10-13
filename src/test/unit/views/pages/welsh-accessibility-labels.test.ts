import { describe, expect, test } from '@jest/globals';

import { env, escapeHtml } from '../helpers/nunjucksEnv';

const chooseAction = require('../../../../main/locales/cy/choose-action.json');
const chooseServiceArea = require('../../../../main/locales/cy/choose-service-area.json');
const chooseService = require('../../../../main/locales/cy/choose-service.json');
const cookiesTranslations = require('../../../../main/locales/cy/cookies.json');
const courtTranslations = require('../../../../main/locales/cy/court.json');
const homeTranslations = require('../../../../main/locales/cy/home.json');
const notFoundTranslations = require('../../../../main/locales/cy/not-found.json');
const postcodeSearch = require('../../../../main/locales/cy/postcode-search.json');
const searchLocation = require('../../../../main/locales/cy/search/location.json');
const searchOption = require('../../../../main/locales/cy/search/option.json');
const serviceCentreTranslations = require('../../../../main/locales/cy/service-centre.json');
const templateTranslations = require('../../../../main/locales/cy/template.json');

describe('Welsh accessibility labels', () => {
  test.each([
    ['choose-action.njk', { ...chooseAction, errors: true }],
    [
      'choose-service.njk',
      {
        ...chooseService,
        errors: true,
        services: [{ id: 'service', text: 'Gwasanaeth', description: 'Disgrifiad', value: 'service' }],
      },
    ],
    [
      'choose-service-area.njk',
      {
        ...chooseServiceArea,
        errors: true,
        serviceNameLocalised: 'gwasanaeth',
        areas: [{ id: 'area', text: 'Ardal', description: 'Disgrifiad', value: 'area' }],
      },
    ],
    [
      'postcode-search.njk',
      {
        ...postcodeSearch,
        error: true,
        errorType: 'blankPostcode',
        serviceAreaLocalised: 'ysgariad',
      },
    ],
    ['search/option.njk', { ...searchOption, errors: true }],
    ['search/location.njk', { ...searchLocation, errorType: 'blank' }],
  ])('uses the Welsh visually hidden error label in %s', (view, context) => {
    const html = env.render(view, context);

    expect(html).toContain('<span class="govuk-visually-hidden">Gwall:</span>');
    expect(html).not.toContain('<span class="govuk-visually-hidden">Error:</span>');
  });

  test('renders the back link without an additional navigation landmark', () => {
    const html = env.render('template.njk', {
      ...templateTranslations,
      feedback: '',
      globals: { basePath: '' },
    });

    expect(html).toContain('class="govuk-back-link"');
    expect(html).not.toContain('govuk-back-link-wrapper');
    expect(html).not.toContain('aria-label=ariaLabel');
  });

  test('uses active Welsh labels in the shared page template', () => {
    const html = env.render('template.njk', {
      ...templateTranslations,
      feedback: '',
      globals: { basePath: '' },
    });

    expect(html).toContain(`<title>${templateTranslations.pageTitle}</title>`);
    expect(html).toContain(`aria-label="${templateTranslations.serviceInformationLabel}"`);
    expect(html).toContain(`<h2 class="govuk-visually-hidden">${templateTranslations.footerSupportLinksLabel}</h2>`);
    expect(html).toContain(`aria-label="${templateTranslations.cookieBannerH1}"`);
  });

  test('uses the Welsh document title on the home page', () => {
    const html = env.render('home.njk', {
      ...templateTranslations,
      ...homeTranslations,
      feedback: '',
      globals: { basePath: '' },
    });

    expect(html).toContain(`<title>${homeTranslations.pageTitle}</title>`);
  });

  test('uses the Welsh document title on the not-found page', () => {
    const html = env.render('not-found.njk', {
      ...templateTranslations,
      ...notFoundTranslations,
      feedback: '',
      globals: { basePath: '' },
    });

    expect(html).toContain(escapeHtml(notFoundTranslations.pageTitle));
  });

  test('hides court separators from assistive technology', () => {
    const html = env.render('court.njk', {
      ...courtTranslations,
      htmlLang: 'cy',
      court: {
        name: 'Test Court',
        lastUpdatedAt: '1 Ionawr 2024',
        warningNotice: 'English warning',
        warningNoticeCy: 'Rhybudd prawf',
        courtAddresses: [],
        openingHoursByType: [],
        counterServices: [],
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
      },
    });

    const separators = html.match(/<hr[^>]+>/g) ?? [];
    expect(separators).toHaveLength(4);
    separators.forEach(separator => expect(separator).toContain('aria-hidden="true"'));
  });

  test('uses Welsh warning and accordion labels on the court page', () => {
    const html = env.render('court.njk', {
      ...courtTranslations,
      htmlLang: 'cy',
      court: {
        name: 'Test Court',
        lastUpdatedAt: '1 Ionawr 2024',
        warningNotice: 'English warning',
        warningNoticeCy: 'Rhybudd prawf',
        courtAddresses: [],
        openingHoursByType: [],
        counterServices: [],
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
      },
    });

    expect(html).toContain(`<span class="govuk-visually-hidden">${courtTranslations.warningFallbackText}</span>`);
    expect(html).toContain(courtTranslations.accordion.showSectionAriaLabel);
    expect(html).not.toContain('Show this section');
    expect(html).not.toContain('Hide this section');
  });

  test('uses Welsh accordion labels on the service centre page', () => {
    const html = env.render('service-centre.njk', {
      ...serviceCentreTranslations,
      htmlLang: 'cy',
      serviceCentre: {
        name: 'Test Service Centre',
        lastUpdatedAt: '1 Ionawr 2024',
        warningNotice: null,
        warningNoticeCy: null,
        serviceCentreAddresses: [],
        serviceCentreAreasOfLaw: [],
        serviceCentreContactDetails: [],
      },
    });

    expect(html).toContain(serviceCentreTranslations.accordion.showSectionAriaLabel);
    expect(html).not.toContain('Show this section');
    expect(html).not.toContain('Hide this section');
  });

  test('uses the Welsh success label on the cookie preferences notification', () => {
    const html = env.render('cookies.njk', {
      ...templateTranslations,
      ...cookiesTranslations,
      feedback: '',
      globals: { basePath: '' },
    });

    expect(html).toContain(cookiesTranslations.notificationBannerTitle);
    expect(html).not.toContain('>Success<');
  });
});
