import * as path from 'path';

import * as nunjucks from 'nunjucks';

const govukTemplates = path.dirname(require.resolve('govuk-frontend/package.json')) + '/dist';
const viewsPath = path.resolve(__dirname, '../../../main/views');

const env = nunjucks.configure([govukTemplates, viewsPath], {
  autoescape: false,
});

describe('Search Option View', () => {
  const i18n = require('../../../main/locales/en/search/option.json');
  const welshI18n = require('../../../main/locales/cy/search/option.json');

  test('renders the search option page with English content', () => {
    const html = env.render('search/option.njk', i18n);

    expect(html).toContain(i18n.title);
    expect(html).toContain(i18n.question);
    expect(html).toContain(i18n.hint);
    expect(html).toContain(i18n.answers.a1);
    expect(html).toContain(i18n.answers.a2);
    expect(html).toContain(i18n.button);
  });

  test('renders validation error summary when errors are present', () => {
    const html = env.render('search/option.njk', { ...i18n, errors: true });

    expect(html).toContain(i18n.error.title);
    expect(html).toContain(i18n.error.text);
    expect(html).toContain('href="#i-have-the-name"');
  });

  test('renders the search option page with Welsh content', () => {
    const html = env.render('search/option.njk', welshI18n);

    expect(html).toContain(welshI18n.title);
    expect(html).toContain(welshI18n.question);
    expect(html).toContain(welshI18n.hint);
    expect(html).toContain(welshI18n.answers.a1);
    expect(html).toContain(welshI18n.answers.a2);
    expect(html).toContain(welshI18n.button);
  });
});
