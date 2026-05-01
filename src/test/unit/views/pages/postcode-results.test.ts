import { describe, expect, test } from '@jest/globals';

import { env } from '../helpers/nunjucksEnv';

describe('PostcodeResults View', () => {
  const i18n = require('../../../../main/locales/en/postcode-results.json');
  const welshI18n = require('../../../../main/locales/cy/postcode-results.json');

  const baseResults = {
    courts: [
      { courtSlug: 'court-1', courtName: 'Court 1', distance: 12.345 },
      { courtSlug: 'court-2', courtName: 'Court 2', distance: 7.89 },
    ],
  };

  test('renders the page with all main content and results (English)', () => {
    const html = env.render('postcode-results.njk', {
      ...i18n,
      results: baseResults,
      postcode: 'AB1 2CD',
      serviceArea: 'divorce',
      isDivorceOrCivil: false,
      onlineText: 'Apply online',
      onlineUrl: 'https://apply.example.com',
    });
    expect(html).toContain(i18n.title);
    expect(html).toContain(i18n.question);
    expect(html).toContain('Court 1');
    expect(html).toContain('Court 2');
    expect(html).toContain('12.3 ' + i18n.unit);
    expect(html).toContain('7.9 ' + i18n.unit);
    expect(html).toContain('Apply online');
    expect(html).toContain('https://apply.example.com');
    expect(html).toContain(i18n.applyOnlineHeading);
  });

  test('renders the page with all main content and results (Welsh)', () => {
    const html = env.render('postcode-results.njk', {
      ...welshI18n,
      results: baseResults,
      postcode: 'AB1 2CD',
      serviceArea: 'divorce',
      isDivorceOrCivil: false,
      onlineText: 'Gwnewch gais ar-lein',
      onlineUrl: 'https://apply.example.com',
    });
    expect(html).toContain(welshI18n.title);
    expect(html).toContain(welshI18n.question);
    expect(html).toContain('Court 1');
    expect(html).toContain('Court 2');
    expect(html).toContain('12.3 ' + welshI18n.unit);
    expect(html).toContain('7.9 ' + welshI18n.unit);
    expect(html).toContain('Gwnewch gais ar-lein');
    expect(html).toContain('https://apply.example.com');
    expect(html).toContain(welshI18n.applyOnlineHeading);
  });

  test('renders divorce hints and single result for divorce (English)', () => {
    const html = env.render('postcode-results.njk', {
      ...i18n,
      results: { courts: [{ courtSlug: 'court-1', courtName: 'Court 1', distance: 1.23 }] },
      postcode: 'AB1 2CD',
      serviceArea: 'divorce',
      isDivorceOrCivil: true,
    });
    expect(html).toContain(i18n.divorceHint);
    expect(html).toContain(i18n.secondHint.replace('{postcode}', 'AB1 2CD'));
    expect(html).toContain(i18n.thirdHint);
    expect(html).toContain('Court 1');
  });

  test('renders civil hints and single result for civil (Welsh)', () => {
    const html = env.render('postcode-results.njk', {
      ...welshI18n,
      results: { courts: [{ courtSlug: 'court-1', courtName: 'Court 1', distance: 1.23 }] },
      postcode: 'AB1 2CD',
      serviceArea: 'civil',
      isDivorceOrCivil: true,
    });
    expect(html).toContain(welshI18n.civilHint);
    expect(html).toContain(welshI18n.secondHint.replace('{postcode}', 'AB1 2CD'));
    expect(html).toContain(welshI18n.thirdHint);
    expect(html).toContain('Court 1');
  });

  test('renders singleResultsHint for one result', () => {
    const html = env.render('postcode-results.njk', {
      ...i18n,
      results: { courts: [{ courtSlug: 'court-1', courtName: 'Court 1', distance: 1.23 }] },
      postcode: 'AB1 2CD',
      serviceArea: 'probate',
      isDivorceOrCivil: false,
    });
    expect(html).toContain(
      i18n.singleResultsHint
        .replace('{postcode}', 'AB1 2CD')
        .replace('{serviceArea}', 'probate')
        .replace('{total}', '1')
    );
  });

  test('renders multipleResultsHint for multiple results', () => {
    const html = env.render('postcode-results.njk', {
      ...i18n,
      results: baseResults,
      postcode: 'AB1 2CD',
      serviceArea: 'probate',
      isDivorceOrCivil: false,
    });
    expect(html).toContain(
      i18n.multipleResultsHint
        .replace('{postcode}', 'AB1 2CD')
        .replace('{serviceArea}', 'probate')
        .replace('{total}', '2')
    );
  });

  test('renders postcodeSearchResultsHint when postcodeOnlySearch is true', () => {
    const html = env.render('postcode-results.njk', {
      ...i18n,
      results: baseResults,
      postcode: 'AB1 2CD',
      postcodeOnlySearch: true,
    });
    expect(html).toContain(i18n.postcodeSearchResultsHint.replace('{postcode}', 'AB1 2CD').replace('{total}', '2'));
  });

  test('renders correctly with no onlineText or onlineUrl', () => {
    const html = env.render('postcode-results.njk', {
      ...i18n,
      results: baseResults,
      postcode: 'AB1 2CD',
      serviceArea: 'divorce',
      isDivorceOrCivil: false,
    });
    expect(html).not.toContain('side-content');
  });

  test('renders correctly with empty results', () => {
    const html = env.render('postcode-results.njk', {
      ...i18n,
      results: { courts: [] },
      postcode: 'AB1 2CD',
      serviceArea: 'divorce',
      isDivorceOrCivil: false,
    });
    expect(html).toContain('search-results');
    // No court headings
    expect(html).not.toContain('govuk-heading-m');
  });
});
