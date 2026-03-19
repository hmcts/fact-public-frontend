import * as path from 'path';

import { describe, expect, test } from '@jest/globals';
import * as nunjucks from 'nunjucks';

const govukTemplates = path.dirname(require.resolve('govuk-frontend/package.json')) + '/dist';
const viewsPath = path.resolve(__dirname, '../../../main/views');
const env = nunjucks.configure([govukTemplates, viewsPath], { autoescape: false });

describe('UnknownService View', () => {
  const i18n = require('../../../main/locales/en/unknown-service.json');
  const welshI18n = require('../../../main/locales/cy/unknown-service.json');

  test('renders the unknown-service page with correct content', () => {
    const html = env.render('unknown-service.njk', i18n);
    expect(html).toContain(i18n.title);
    expect(html).toContain(i18n.h1);
    expect(html).toContain(i18n.p_1);
    expect(html).toContain(i18n.h2_1);
    expect(html).toContain(i18n.a_1);
    expect(html).toContain(i18n.h2_5);
    expect(html).toContain(i18n.a_5);
    expect(html).toContain(i18n.h2_2);
    expect(html).toContain(i18n.a_2);
    expect(html).toContain(i18n.h2_3);
    expect(html).toContain(i18n.a_3_1);
    expect(html).toContain(i18n.a_3_2);
    expect(html).toContain(i18n.a_3_3);
    expect(html).toContain(i18n.h2_4);
    expect(html).toContain(i18n.a_4);
    expect(html).toContain('govuk-heading-l');
    expect(html).toContain('govuk-heading-m');
    expect(html).toContain('govuk-body');
  });

  test('renders the unknown-service page with correct content (Welsh)', () => {
    const html = env.render('unknown-service.njk', welshI18n);
    expect(html).toContain(welshI18n.title);
    expect(html).toContain(welshI18n.h1);
    expect(html).toContain(welshI18n.p_1);
    expect(html).toContain(welshI18n.h2_1);
    expect(html).toContain(welshI18n.a_1);
    expect(html).toContain(welshI18n.h2_5);
    expect(html).toContain(welshI18n.a_5);
    expect(html).toContain(welshI18n.h2_2);
    expect(html).toContain(welshI18n.a_2);
    expect(html).toContain(welshI18n.h2_3);
    expect(html).toContain(welshI18n.a_3_1);
    expect(html).toContain(welshI18n.a_3_2);
    expect(html).toContain(welshI18n.a_3_3);
    expect(html).toContain(welshI18n.h2_4);
    expect(html).toContain(welshI18n.a_4);
    expect(html).toContain('govuk-heading-l');
    expect(html).toContain('govuk-heading-m');
    expect(html).toContain('govuk-body');
  });
});

