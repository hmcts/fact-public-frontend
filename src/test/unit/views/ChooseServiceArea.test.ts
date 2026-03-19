import * as path from 'path';

import { describe, expect, test } from '@jest/globals';
import * as nunjucks from 'nunjucks';

const govukTemplates = path.dirname(require.resolve('govuk-frontend/package.json')) + '/dist';
const viewsPath = path.resolve(__dirname, '../../../main/views');
const env = nunjucks.configure([govukTemplates, viewsPath], { autoescape: false });

describe('ChooseServiceArea View', () => {
  const i18n = require('../../../main/locales/en/choose-service-area.json');
  const welshI18n = require('../../../main/locales/cy/choose-service-area.json');

  const areas = [
    { id: 'area1', text: 'Area 1', description: 'Description 1' },
    { id: 'area2', text: 'Area 2', description: 'Description 2' },
  ];

  test('renders the choose-service-area page with correct English content', () => {
    const html = env.render('choose-service-area.njk', {
      ...i18n,
      areas,
    });
    const expectedTitle = i18n.title.replace('{serviceName}', i18n.serviceName).toLowerCase();
    const expectedQuestion = i18n.question.replace('{serviceName}', i18n.serviceName).toLowerCase();
    expect(html).toContain(expectedTitle);
    expect(html).toContain(expectedQuestion);
    expect(html).toContain(i18n.answers.a1);
    expect(html).toContain(i18n.button);
    expect(html).toContain('govuk-radios');
    expect(html).toContain('govuk-button');
    expect(html).toContain('not-listed');
    expect(html).toContain(i18n.divider);
  });

  test('renders the choose-service-area page with correct Welsh content', () => {
    const html = env.render('choose-service-area.njk', {
      ...welshI18n,
      areas,
    });
    const expectedTitle = welshI18n.title.replace('{serviceName}', welshI18n.serviceName).toLowerCase();
    const expectedQuestion = welshI18n.question.replace('{serviceName}', welshI18n.serviceName).toLowerCase();
    expect(html).toContain(expectedTitle);
    expect(html).toContain(expectedQuestion);
    expect(html).toContain(welshI18n.answers.a1);
    expect(html).toContain(welshI18n.button);
    expect(html).toContain('govuk-radios');
    expect(html).toContain('govuk-button');
    expect(html).toContain('not-listed');
    expect(html).toContain(welshI18n.divider);
  });
});
