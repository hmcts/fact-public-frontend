import * as path from 'path';

import * as nunjucks from 'nunjucks';

const govukTemplates = path.dirname(require.resolve('govuk-frontend/package.json')) + '/dist';
const viewsPath = path.resolve(__dirname, '../../../main/views');

const env = nunjucks.configure([govukTemplates, viewsPath], {
  autoescape: false,
});

describe('Search Location View', () => {
  const i18n = require('../../../main/locales/en/search/location.json');
  const welshI18n = require('../../../main/locales/cy/search/location.json');

  test('renders the search location page with English content', () => {
    const html = env.render('search/location.njk', i18n);

    expect(html).toContain(i18n.title);
    expect(html).toContain(i18n.question);
    expect(html).toContain(i18n.hint);
    expect(html).toContain(i18n.text);
    expect(html).toContain(i18n.button);
  });

  test('renders validation error summary from errorType', () => {
    const html = env.render('search/location.njk', { ...i18n, errorType: 'blank' });

    expect(html).toContain(i18n.errorBlank.title);
    expect(html).toContain(i18n.errorBlank.text);
    expect(html).toContain('href="#search"');
  });

  test('renders no results content when a search has been performed without matches', () => {
    const html = env.render('search/location.njk', { ...i18n, hasSearched: true, search: 'Blackburn', results: [] });

    expect(html).toContain(i18n.resultsTitle);
    expect(html).toContain(i18n.noResults.p1);
  });

  test('links court and service-centre results to their respective detail pages', () => {
    const html = env.render('search/location.njk', {
      ...i18n,
      hasSearched: true,
      search: 'example',
      results: [
        { name: 'Example Court', slug: 'example-court', locationType: 'COURT', serviceCentre: false },
        {
          name: 'Example Service Centre',
          slug: 'example-service-centre',
          locationType: 'SERVICE_CENTRE',
          serviceCentre: true,
        },
      ],
    });

    expect(html).toContain('href="/courts/example-court"');
    expect(html).toContain('href="/service-centres/example-service-centre"');
  });

  test('uses the legacy serviceCentre flag when locationType is not present', () => {
    const html = env.render('search/location.njk', {
      ...i18n,
      hasSearched: true,
      search: 'example',
      results: [{ name: 'Example Service Centre', slug: 'example-service-centre', serviceCentre: true }],
    });

    expect(html).toContain('href="/service-centres/example-service-centre"');
  });

  test('renders the search location page with Welsh content', () => {
    const html = env.render('search/location.njk', welshI18n);

    expect(html).toContain(welshI18n.title);
    expect(html).toContain(welshI18n.question);
    expect(html).toContain(welshI18n.hint);
    expect(html).toContain(welshI18n.text);
    expect(html).toContain(welshI18n.button);
  });
});
