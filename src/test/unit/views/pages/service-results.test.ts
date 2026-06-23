import { describe, expect, test } from '@jest/globals';

import { env } from '../helpers/nunjucksEnv';

describe('ServiceResults View', () => {
  const i18n = require('../../../../main/locales/en/service-results.json');
  const welshI18n = require('../../../../main/locales/cy/service-results.json');

  const baseResults = {
    serviceCentreSlug: 'service-centre-1',
    serviceCentreName: 'Service Centre 1',
  };

  test('renders the page with all main content and result (English)', () => {
    const html = env.render('service-results.njk', {
      ...i18n,
      results: baseResults,
      hint: i18n.hint.replace('{serviceArea}', 'divorce'),
      onlineText: 'Apply online',
      onlineUrl: 'https://apply.example.com',
    });
    expect(html).toContain(i18n.title);
    expect(html).toContain(i18n.question);
    expect(html).toContain('Service Centre 1');
    expect(html).toContain('/service-centres/service-centre-1');
    expect(html).toContain('Apply online');
    expect(html).toContain('https://apply.example.com');
    expect(html).toContain(i18n.applyOnlineHeading);
    expect(html).toContain(i18n.regionStatement);
    expect(html).toContain('divorce');
  });

  test('renders the page with all main content and result (Welsh)', () => {
    const html = env.render('service-results.njk', {
      ...welshI18n,
      results: baseResults,
      hint: welshI18n.hint.replace('{serviceArea}', 'ysgariad'),
      onlineText: 'Gwnewch gais ar-lein',
      onlineUrl: 'https://apply.example.com',
    });
    expect(html).toContain(welshI18n.title);
    expect(html).toContain(welshI18n.question);
    expect(html).toContain('Service Centre 1');
    expect(html).toContain('/service-centres/service-centre-1');
    expect(html).toContain('Gwnewch gais ar-lein');
    expect(html).toContain('https://apply.example.com');
    expect(html).toContain(welshI18n.applyOnlineHeading);
    expect(html).toContain(welshI18n.regionStatement);
    expect(html).toContain('ysgariad');
  });

  test('renders correctly with no onlineText or onlineUrl', () => {
    const html = env.render('service-results.njk', {
      ...i18n,
      results: baseResults,
      hint: i18n.hint.replace('{serviceArea}', 'divorce'),
    });
    expect(html).not.toContain('side-content');
  });

  test('renders fallback court link when only court fields are present', () => {
    const html = env.render('service-results.njk', {
      ...i18n,
      results: { courtSlug: 'court-1', courtName: 'Court 1' },
      hint: i18n.hint.replace('{serviceArea}', 'divorce'),
    });

    expect(html).toContain('/courts/court-1');
    expect(html).toContain('Court 1');
  });

  test('renders correctly with empty results', () => {
    const html = env.render('service-results.njk', {
      ...i18n,
      results: {},
      hint: i18n.hint.replace('{serviceArea}', 'divorce'),
    });
    expect(html).not.toContain('govuk-heading-m'); // No court heading
    expect(html).toContain(i18n.regionStatement);
  });
});
