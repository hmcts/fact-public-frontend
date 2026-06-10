import { describe, expect, test } from '@jest/globals';

import { env } from '../helpers/nunjucksEnv';

describe('PostcodeSearch View', () => {
  const i18n = require('../../../../main/locales/en/postcode-search.json');
  const welshI18n = require('../../../../main/locales/cy/postcode-search.json');
  const serviceAreaLocalised = 'Divorce';

  test('renders the page with all main content and input (English)', () => {
    const html = env.render('postcode-search.njk', { ...i18n, serviceAreaLocalised });
    expect(html).toContain(i18n.title);
    expect(html).toContain(i18n.question);
    expect(html).toContain(i18n.text);
    expect(html).toContain('govuk-input');
    expect(html).toContain('govuk-button');
    expect(html).toContain('autocomplete="postal-code"');
    expect(html).toContain(i18n.hints.default.replace('{serviceArea}', serviceAreaLocalised.toLowerCase()));
  });

  test('renders the page with all main content and input (Welsh)', () => {
    const html = env.render('postcode-search.njk', { ...welshI18n, serviceAreaLocalised });
    expect(html).toContain(welshI18n.title);
    expect(html).toContain(welshI18n.question);
    expect(html).toContain(welshI18n.text);
    expect(html).toContain('govuk-input');
    expect(html).toContain('govuk-button');
    expect(html).toContain('autocomplete="postal-code"');
    expect(html).toContain(welshI18n.hints.default.replace('{serviceArea}', serviceAreaLocalised.toLowerCase()));
  });

  test('renders error summary when error is present (English)', () => {
    const html = env.render('postcode-search.njk', {
      ...i18n,
      serviceAreaLocalised,
      error: true,
      errorType: 'blankPostcode',
    });
    expect(html).toContain('govuk-error-summary');
    expect(html).toContain(i18n.errorTitle);
    expect(html).toContain(i18n.errorText.title);
    expect(html).toContain(i18n.errorText.blankPostcode);
    expect(html).toContain('href="#postcode"');
  });

  test('renders error summary when error is present (Welsh)', () => {
    const html = env.render('postcode-search.njk', {
      ...welshI18n,
      serviceAreaLocalised,
      error: true,
      errorType: 'blankPostcode',
    });
    expect(html).toContain('govuk-error-summary');
    expect(html).toContain(welshI18n.errorTitle);
    expect(html).toContain(welshI18n.errorText.title);
    expect(html).toContain(welshI18n.errorText.blankPostcode);
    expect(html).toContain('href="#postcode"');
  });

  test('renders input error message when error is present (English)', () => {
    const html = env.render('postcode-search.njk', {
      ...i18n,
      serviceAreaLocalised,
      error: true,
      errorType: 'invalidPostcode',
    });
    expect(html).toContain(i18n.errorText.invalidPostcode);
  });

  test('renders input error message when error is present (Welsh)', () => {
    const html = env.render('postcode-search.njk', {
      ...welshI18n,
      serviceAreaLocalised,
      error: true,
      errorType: 'invalidPostcode',
    });
    expect(html).toContain(welshI18n.errorText.invalidPostcode);
  });

  test('renders missing postcode space error message (English)', () => {
    const html = env.render('postcode-search.njk', {
      ...i18n,
      serviceAreaLocalised,
      error: true,
      errorType: 'missingPostcodeSpace',
    });
    expect(html).toContain(i18n.errorText.missingPostcodeSpace);
  });

  test('renders missing postcode space error message (Welsh)', () => {
    const html = env.render('postcode-search.njk', {
      ...welshI18n,
      serviceAreaLocalised,
      error: true,
      errorType: 'missingPostcodeSpace',
    });
    expect(html).toContain(welshI18n.errorText.missingPostcodeSpace);
  });

  test('renders childcare hint when serviceAreaIsChildcare is true (English)', () => {
    const html = env.render('postcode-search.njk', {
      ...i18n,
      serviceAreaLocalised,
      serviceAreaIsChildcare: true,
    });
    expect(html).toContain(i18n.hints.childcare);
  });

  test('renders childcare hint when serviceAreaIsChildcare is true (Welsh)', () => {
    const html = env.render('postcode-search.njk', {
      ...welshI18n,
      serviceAreaLocalised,
      serviceAreaIsChildcare: true,
    });
    expect(html).toContain(welshI18n.hints.childcare);
  });

  test('renders no service hint when noServiceSearch is true (English)', () => {
    const html = env.render('postcode-search.njk', {
      ...i18n,
      serviceAreaLocalised,
      noServiceSearch: true,
    });
    expect(html).toContain(i18n.hints.noService);
  });

  test('renders no service hint when noServiceSearch is true (Welsh)', () => {
    const html = env.render('postcode-search.njk', {
      ...welshI18n,
      serviceAreaLocalised,
      noServiceSearch: true,
    });
    expect(html).toContain(welshI18n.hints.noService);
  });

  test('renders no results section when hasNoResults is true (English)', () => {
    const html = env.render('postcode-search.njk', {
      ...i18n,
      serviceAreaLocalised,
      hasNoResults: true,
    });
    expect(html).toContain('no-search-results');
    expect(html).toContain(i18n.noResults.p1);
    expect(html).toContain(i18n.noResults.p2);
    Object.values(i18n.noResults.list).forEach(item => {
      expect(html).toContain(item);
    });
  });

  test('renders no results section when hasNoResults is true (Welsh)', () => {
    const html = env.render('postcode-search.njk', {
      ...welshI18n,
      serviceAreaLocalised,
      hasNoResults: true,
    });
    expect(html).toContain('no-search-results');
    expect(html).toContain(welshI18n.noResults.p1);
    expect(html).toContain(welshI18n.noResults.p2);
    Object.values(welshI18n.noResults.list).forEach(item => {
      expect(html).toContain(item);
    });
  });

  test('renders correctly with empty postcode value (English)', () => {
    const html = env.render('postcode-search.njk', {
      ...i18n,
      serviceAreaLocalised,
      postcode: '',
    });
    expect(html).toContain('value=""');
  });

  test('renders correctly with empty postcode value (Welsh)', () => {
    const html = env.render('postcode-search.njk', {
      ...welshI18n,
      serviceAreaLocalised,
      postcode: '',
    });
    expect(html).toContain('value=""');
  });

  test('does not render error summary when error is not present (English)', () => {
    const html = env.render('postcode-search.njk', { ...i18n, serviceAreaLocalised });
    expect(html).not.toContain('govuk-error-summary');
    expect(html).not.toContain(i18n.errorText.title);
  });

  test('does not render error summary when error is not present (Welsh)', () => {
    const html = env.render('postcode-search.njk', { ...welshI18n, serviceAreaLocalised });
    expect(html).not.toContain('govuk-error-summary');
    expect(html).not.toContain(welshI18n.errorText.title);
  });
});
