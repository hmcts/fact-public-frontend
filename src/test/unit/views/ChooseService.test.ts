import * as path from 'path';

import { describe, expect, test } from '@jest/globals';
import * as nunjucks from 'nunjucks';

const govukTemplates = path.dirname(require.resolve('govuk-frontend/package.json')) + '/dist';
const viewsPath = path.resolve(__dirname, '../../../main/views');
const env = nunjucks.configure([govukTemplates, viewsPath], { autoescape: false });

describe('ChooseService View', () => {
  const i18n = require('../../../main/locales/en/choose-service.json');
  const welshI18n = require('../../../main/locales/cy/choose-service.json');

  const services = [
    { id: 'service1', text: 'Service 1', description: 'Description 1', value: 'service1' },
    { id: 'service2', text: 'Service 2', description: 'Description 2', value: 'service2' }
  ];

  test('renders the choose-service page with correct English content', () => {
    const html = env.render('choose-service.njk', {
      ...i18n,
      services
    });
    // Check for fragments in HTML
    expect(html).toContain('<title>');
    expect(html).toContain(i18n.title);
    expect(html).toContain(i18n.question);
    expect(html).toContain(i18n.answers.a1);
    expect(html).toContain(i18n.button);
    expect(html).toContain('govuk-radios');
    expect(html).toContain('govuk-button');
    expect(html).toContain('not-listed');
    expect(html).toContain(i18n.divider);
  });

  test('renders the choose-service page with correct Welsh content', () => {
    const html = env.render('choose-service.njk', {
      ...welshI18n,
      services
    });
    expect(html).toContain('<title>');
    expect(html).toContain(welshI18n.title);
    expect(html).toContain(welshI18n.question);
    expect(html).toContain(welshI18n.answers.a1);
    expect(html).toContain(welshI18n.button);
    expect(html).toContain('govuk-radios');
    expect(html).toContain('govuk-button');
    expect(html).toContain('not-listed');
    expect(html).toContain(welshI18n.divider);
  });

  test('renders error summary when errors are present', () => {
    const html = env.render('choose-service.njk',{
      ...i18n,
      services,
      errors: true
    });
    expect(html).toContain('govuk-error-summary');
    expect(html).toContain(i18n.errorTitle);
    expect(html).toContain(i18n.error.title);
    expect(html).toContain(i18n.error.text);
  });
});


