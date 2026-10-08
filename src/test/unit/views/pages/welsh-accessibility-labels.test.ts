import { describe, expect, test } from '@jest/globals';

import { env } from '../helpers/nunjucksEnv';

const chooseAction = require('../../../../main/locales/cy/choose-action.json');
const chooseServiceArea = require('../../../../main/locales/cy/choose-service-area.json');
const chooseService = require('../../../../main/locales/cy/choose-service.json');
const courtTranslations = require('../../../../main/locales/cy/court.json');
const postcodeSearch = require('../../../../main/locales/cy/postcode-search.json');
const searchLocation = require('../../../../main/locales/cy/search/location.json');
const searchOption = require('../../../../main/locales/cy/search/option.json');
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
});
