import { describe, expect, test } from '@jest/globals';

import { env } from '../helpers/nunjucksEnv';

const i18n = require('../../../../main/locales/en/home.json');

describe('Home page', () => {
  test('renders home content', () => {
    const html = env.render('home.njk', i18n);
    expect(html).toContain(i18n.pageTitle);
  });
});
