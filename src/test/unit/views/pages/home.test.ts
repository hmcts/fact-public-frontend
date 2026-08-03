import { describe, expect, test } from '@jest/globals';

import { env } from '../helpers/nunjucksEnv';

const welshI18n = require('../../../../main/locales/cy/home.json');
const i18n = require('../../../../main/locales/en/home.json');

describe('Home page', () => {
  test('renders home content', () => {
    const html = env.render('home.njk', i18n);
    expect(html).toContain(i18n.pageTitle);
    expect(html).toContain(i18n.main.list_intro);
    expect(html).not.toContain('govuk-back-link');
  });

  test('renders the Welsh list introduction', () => {
    const html = env.render('home.njk', welshI18n);

    expect(html).toContain(welshI18n.main.list_intro);
  });
});
