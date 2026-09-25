import { describe, expect, test } from '@jest/globals';

import { env } from '../helpers/nunjucksEnv';

const i18n = require('../../../../main/locales/en/template.json');

describe('Base template', () => {
  test('renders header/footer content', () => {
    const html = env.render('template.njk', {
      ...i18n,
      serviceName: i18n.serviceName,
      footerLinks: i18n.footerLinks,
      feedback: '',
      languageToggle: i18n.languageToggle,
      cookieBannerP1: 'Cookies',
      cookieBannerP2: 'More cookies',
      cookieBannerH1: 'Cookies',
      cookieBannerAcceptButton: 'Accept',
      cookieBannerRejectButton: 'Reject',
      cookieBannerViewCookies: 'View cookies',
      cookieBannerHideButton: 'Hide',
      jstag: '/jstag.js',
      globals: { basePath: '' },
    });

    expect(html).toContain(i18n.serviceName);
    expect(html).toContain(i18n.languageToggle);
    expect(html).toContain("window.gtag('consent', 'default'");
    expect(html).toContain("analytics_storage: 'denied'");
    expect(html).toContain('name="dynatrace-jstag" content="/jstag.js"');
    expect(html).not.toContain('<script src="/jstag.js"');
    expect(html).not.toContain('https://www.googletagmanager.com/gtm.js');
    expect(html.indexOf("window.gtag('consent', 'default'")).toBeLessThan(html.indexOf('/main-'));
  });
});
