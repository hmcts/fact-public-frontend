import { describe, expect, test } from '@jest/globals';

import { env } from '../helpers/nunjucksEnv';

const i18n = require('../../../../main/locales/en/court-closed.json');
const serviceCentreI18n = require('../../../../main/locales/en/service-centre.json').closed;

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

  test.each([
    ['Court', i18n],
    ['Service Centre', serviceCentreI18n],
  ])('escapes an API-supplied %s name in the page title', (locationType, locale) => {
    const name = `<img src=x onerror=alert(1)> ${locationType}`;
    const html = env.render('court-closed.njk', {
      ...locale,
      name,
      title: locale.title.replace('{name}', name),
    });

    expect(html).toContain(`&lt;img src=x onerror=alert(1)&gt; ${locationType}`);
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
  });
});
