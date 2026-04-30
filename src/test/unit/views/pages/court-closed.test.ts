import { describe, expect, test } from '@jest/globals';

import { env } from '../helpers/nunjucksEnv';

const i18n = require('../../../../main/locales/en/court-closed.json');

describe('Court closed page', () => {
  test('renders closed court content', () => {
    const html = env.render('court-closed.njk', {
      ...i18n,
      name: 'Closed Court',
      title: i18n.title.replace('{name}', 'Closed Court'),
    });

    expect(html).toContain('Closed Court');
    expect(html).toContain(i18n.p1);
    expect(html).toContain(i18n.linkText);
  });
});
