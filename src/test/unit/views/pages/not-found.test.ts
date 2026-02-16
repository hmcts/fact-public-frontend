import { env } from '../helpers/nunjucksEnv';

const i18n = require('../../../../main/locales/en/not-found.json');

describe('Not found page', () => {
  test('renders not found content', () => {
    const html = env.render('not-found.njk', i18n);
    expect(html).toContain(i18n.h1);
    expect(html).toContain(i18n.p1);
  });
});
