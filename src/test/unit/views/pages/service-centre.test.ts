import { env } from '../helpers/nunjucksEnv';

const courtCy = require('../../../../main/locales/cy/court.json');
const cy = require('../../../../main/locales/cy/service-centre.json');
const courtEn = require('../../../../main/locales/en/court.json');
const en = require('../../../../main/locales/en/service-centre.json');

const buildServiceCentre = () => ({
  name: 'Test Service Centre',
  lastUpdatedAt: '15 January 2024',
  warningNotice: 'Important service update',
  warningNoticeCy: 'Diweddariad gwasanaeth pwysig',
  serviceCentreAddresses: [
    {
      addressType: 'WRITE_TO_US',
      formattedAddressLines: ['1 Service Street', 'London', 'SW1A 1AA'],
      formattedAddressTags: [],
      directionsUrl: null,
    },
  ],
  serviceCentreContactDetails: [
    {
      explanation: 'For general enquiries',
      explanationCy: 'Ar gyfer ymholiadau cyffredinol',
      email: 'service@example.com',
      phoneNumber: '0300 123 4567',
      serviceCentreContactDescription: { name: 'Enquiries', nameCy: 'Ymholiadau' },
    },
  ],
  serviceCentreAreasOfLaw: [
    {
      areasOfLaw: [
        {
          name: 'Divorce',
          nameCy: 'Ysgariad',
          displayName: 'Divorce cases',
          displayNameCy: 'Achosion ysgariad',
          externalLink: 'https://example.com/divorce',
          externalLinkCy: 'https://example.com/cy/divorce',
        },
      ],
    },
  ],
});

const renderPage = (translations: typeof en, htmlLang: 'en' | 'cy' = 'en', overrides = {}) =>
  env.render('service-centre.njk', {
    ...translations,
    htmlLang,
    serviceCentre: { ...buildServiceCentre(), ...overrides },
  });

describe('Service centre page', () => {
  test.each([
    ['English', en, courtEn],
    ['Welsh', cy, courtCy],
  ])('uses the existing court scammers content in %s', (_language, serviceCentreTranslations, courtTranslations) => {
    expect(serviceCentreTranslations.usefulInformation).toEqual(
      expect.objectContaining({
        scammers: courtTranslations.usefulInformation.scammers,
        scammersBodyPrefix: courtTranslations.usefulInformation.scammersBodyPrefix,
        scammersUrl: courtTranslations.usefulInformation.scammersUrl,
        scammersUrlText: courtTranslations.usefulInformation.scammersUrlText,
        opensInNewTab: courtTranslations.usefulInformation.opensInNewTab,
      })
    );
  });

  test('renders sections in ticket order and omits court-only sections', () => {
    const html = renderPage(en);
    const indexes = [
      html.indexOf('Test Service Centre'),
      html.indexOf(en.pageLastReviewed),
      html.indexOf('Important service update'),
      html.indexOf('id="addresses"'),
      html.indexOf('id="useful-information"'),
      html.indexOf(en.accordion.contactDetailsHeading),
      html.indexOf(en.accordion.casesHeardHeading),
    ];

    expect(indexes.every(index => index >= 0)).toBe(true);
    expect(indexes).toEqual([...indexes].sort((first, second) => first - second));
    expect(html).toContain('Send documents to');
    expect(html).toContain(en.usefulInformation.scammers);
    expect(html).not.toContain('Coming to court');
    expect(html).not.toContain('Hearings at this court');
    expect(html).not.toContain('Opening hours');
    expect(html).not.toContain('Translation and interpretation');
    expect(html).not.toContain('Accessibility');
    expect(html).not.toContain('Building facilities');
    expect(html).not.toContain('Information for professionals');
    expect(html).not.toContain('Make a complaint');
  });

  test('renders the warning only when configured', () => {
    expect(renderPage(en)).toContain('Important service update');
    expect(renderPage(en, 'en', { warningNotice: null })).not.toContain('Important service update');
  });

  test('prefers the Welsh warning on the Welsh page and falls back to English when missing', () => {
    const welshHtml = renderPage(cy, 'cy');
    const fallbackHtml = renderPage(cy, 'cy', { warningNoticeCy: null });

    expect(welshHtml).toContain('Diweddariad gwasanaeth pwysig');
    expect(welshHtml).not.toContain('Important service update');
    expect(fallbackHtml).toContain('Important service update');
  });

  test('renders service-centre contacts, cases and collapsed localized accordion controls', () => {
    const html = renderPage(en);

    expect(html).toContain('For general enquiries');
    expect(html).toContain('href="tel:0300 123 4567"');
    expect(html).toContain('href="mailto:service@example.com"');
    expect(html).toContain('Divorce cases');
    expect(html).toContain('href="https://example.com/divorce"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain(en.accordion.showSection);
    expect(html).toContain(en.accordion.hideSection);
    expect(html).not.toContain('govuk-accordion__section--expanded');
  });

  test('renders Welsh labels, explanations and linked case metadata', () => {
    const html = renderPage(cy, 'cy', { lastUpdatedAt: '15 Ionawr 2024' });

    expect(html).toContain('Anfonwch ddogfennau i');
    expect(html).toContain('Ar gyfer ymholiadau cyffredinol');
    expect(html).toContain('Ymholiadau');
    expect(html).not.toContain('For general enquiries');
    expect(html).not.toContain('>Enquiries<');
    expect(html).toContain('Achosion ysgariad');
    expect(html).toContain('href="https://example.com/cy/divorce"');
    expect(html).toContain(cy.accordion.showSection);
    expect(html).toContain(cy.accordion.hideSection);
  });

  test('supports empty contacts and cases', () => {
    const html = renderPage(en, 'en', { serviceCentreContactDetails: [], serviceCentreAreasOfLaw: [] });

    expect(html).toContain(en.accordion.contactDetailsHeading);
    expect(html).toContain(en.accordion.casesHeardHeading);
    expect(html).not.toContain('href="tel:');
    expect(html).not.toContain('govuk-list--bullet');
  });

  test('renders a fallback message when service-centre addresses are empty', () => {
    const html = renderPage(en, 'en', { serviceCentreAddresses: [] });

    expect(html).toContain(en.addresses.noAddressFound);
    expect(html).not.toContain('1 Service Street');
  });
});
