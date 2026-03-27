import { describe, expect, test } from '@jest/globals';

import { env } from '../helpers/nunjucksEnv';

describe('ChooseServiceArea View', () => {
  const i18n = require('../../../../main/locales/en/choose-service-area.json');
  const welshI18n = require('../../../../main/locales/cy/choose-service-area.json');

  const areas = [
    { id: 'area1', text: 'Area 1', description: 'Description 1' },
    { id: 'area2', text: 'Area 2', description: 'Description 2' },
  ];

  test('renders the choose-service-area page with correct English content', () => {
    const html = env.render('choose-service-area.njk', {
      ...i18n,
      areas,
      serviceNameLocalised: 'some service',
    });
    const expectedTitle = i18n.title.replace('{serviceName}', 'some service');
    const expectedQuestion = i18n.question.replace('{serviceName}', 'some service');
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
      serviceNameLocalised: 'some service',
    });
    const expectedTitle = welshI18n.title.replace('{serviceName}', 'some service');
    const expectedQuestion = welshI18n.question.replace('{serviceName}', 'some service');
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
