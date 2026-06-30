import { CourtBasic } from '../../../../main/schemas/courtBasicSchema';
import { env } from '../helpers/nunjucksEnv';

const welshI18n = require('../../../../main/locales/cy/prefix-search.json');
const i18n = require('../../../../main/locales/en/prefix-search.json');

describe('Prefix search page', () => {
  test('renders prefix search content (English)', () => {
    const html = env.render('prefix-search.njk', {
      ...i18n,
    });
    expect(html).toContain(i18n.title);
    expect(html).toContain(i18n.heading);
    expect(html).toContain(i18n.summary);
    expect(html).toContain('alphabet-buttons');
    expect(html).toContain('A');
    expect(html).toContain('Z');
  });

  test('renders prefix search content (Welsh)', () => {
    const html = env.render('prefix-search.njk', {
      ...welshI18n,
    });
    expect(html).toContain(welshI18n.title);
    expect(html).toContain(welshI18n.heading);
    expect(html).toContain(welshI18n.summary);
    expect(html).toContain('alphabet-buttons');
    expect(html).toContain('A');
    expect(html).toContain('Z');
  });

  test('renders search results when prefix and results are provided (English)', () => {
    const prefix = 'A';
    const results = [
      { name: 'A-Court', slug: 'a-court', isServiceCentre: false },
      { name: 'Another-Court', slug: 'another-court', isServiceCentre: false },
    ];
    const html = env.render('prefix-search.njk', {
      ...i18n,
      prefix,
      results,
    });

    expect(html).toContain('2 ' + i18n.resultsHint + " 'A'");
    expect(html).toContain('A-Court');
    expect(html).toContain('/courts/a-court');
    expect(html).toContain('Another-Court');
    expect(html).toContain('/courts/another-court');
  });

  test('renders service-centre prefix search results with service-centre links', () => {
    const prefix = 'P';
    const results = [
      { name: 'Probate Service Centre', slug: 'probate-service-centre', isServiceCentre: true },
      { name: 'Probate Court', slug: 'probate-court', isServiceCentre: false },
    ];
    const html = env.render('prefix-search.njk', {
      ...i18n,
      prefix,
      results,
    });

    expect(html).toContain('Probate Service Centre');
    expect(html).toContain('/service-centres/probate-service-centre');
    expect(html).not.toContain('/courts/probate-service-centre');
    expect(html).toContain('/courts/probate-court');
  });

  test('renders search results when prefix and results are provided (Welsh)', () => {
    const prefix = 'A';
    const results = [
      { name: 'A-Court', slug: 'a-court' },
      { name: 'Another-Court', slug: 'another-court' },
    ];
    const html = env.render('prefix-search.njk', {
      ...welshI18n,
      prefix,
      results,
    });

    expect(html).toContain('2 ' + welshI18n.resultsHint + " 'A'");
    expect(html).toContain('A-Court');
    expect(html).toContain('/courts/a-court');
    expect(html).toContain('Another-Court');
    expect(html).toContain('/courts/another-court');
  });

  test('renders no results hint when prefix is provided but results are empty (English)', () => {
    const prefix = 'Z';
    const results: CourtBasic[] = [];
    const html = env.render('prefix-search.njk', {
      ...i18n,
      prefix,
      results,
    });

    expect(html).toContain(i18n.noResultsHint + " 'Z'");
    expect(html).not.toContain('results-list');
  });

  test('renders no results hint when prefix is provided but results are empty (Welsh)', () => {
    const prefix = 'Z';
    const results: CourtBasic[] = [];
    const html = env.render('prefix-search.njk', {
      ...welshI18n,
      prefix,
      results,
    });

    expect(html).toContain(welshI18n.noResultsHint + " 'Z'");
    expect(html).not.toContain('results-list');
  });

  test('renders error summary when error flag is set (English)', () => {
    const html = env.render('prefix-search.njk', {
      ...i18n,
      errors: true,
      errorMessage: i18n.error.invalidPrefix,
    });

    expect(html).toContain(i18n.errorTitle);
    expect(html).toContain(i18n.error.title);
    expect(html).toContain(i18n.error.invalidPrefix);
  });

  test('renders error summary when error flag is set (Welsh)', () => {
    const html = env.render('prefix-search.njk', {
      ...welshI18n,
      errors: true,
      errorMessage: welshI18n.error.invalidPrefix,
    });

    expect(html).toContain(welshI18n.errorTitle);
    expect(html).toContain(welshI18n.error.title);
    expect(html).toContain(welshI18n.error.invalidPrefix);
  });
});
