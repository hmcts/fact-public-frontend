import { describe, expect, test } from '@jest/globals';

import { env } from '../helpers/nunjucksEnv';

describe('ChooseAction View', () => {
  const i18n = require('../../../../main/locales/en/choose-action.json');
  const welshI18n = require('../../../../main/locales/cy/choose-action.json');

  test('renders the choose-action page with correct English content', () => {
    const html = env.render('choose-action.njk', i18n);
    expect(html).toContain(i18n.title);
    expect(html).toContain(i18n.question);
    expect(html).toContain(i18n.answers.a1);
    expect(html).toContain(i18n.answers.a2);
    expect(html).toContain(i18n.answers.a3);
    expect(html).toContain(i18n.answers.a4);
    expect(html).toContain(i18n.button);
    expect(html).toContain('govuk-radios');
    expect(html).toContain('govuk-button');
  });

  test('renders the choose-action page with correct Welsh content', () => {
    const html = env.render('choose-action.njk', welshI18n);
    expect(html).toContain(welshI18n.title);
    expect(html).toContain(welshI18n.question);
    expect(html).toContain(welshI18n.answers.a1);
    expect(html).toContain(welshI18n.answers.a2);
    expect(html).toContain(welshI18n.answers.a3);
    expect(html).toContain(welshI18n.answers.a4);
    expect(html).toContain(welshI18n.button);
    expect(html).toContain('govuk-radios');
    expect(html).toContain('govuk-button');
  });
});
