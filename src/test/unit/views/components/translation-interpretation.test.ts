import { env } from '../helpers/nunjucksEnv';

const i18n = require('../../../../main/locales/en/court.json');

describe('Translation and interpretation macro', () => {
  test('renders info link and phone/email when provided', () => {
    const template = `
      {% from "components/translation-interpretation.njk" import translationInterpretation %}
      {{ translationInterpretation(courtTranslations, translationText) }}
    `;

    const html = env.renderString(template, {
      translationText: i18n.translationAndInterpretation,
      courtTranslations: [{ phoneNumber: '01234', email: 'a@example.com' }],
    });

    expect(html).toContain('href="tel:01234"');
    expect(html).toContain('href="mailto:a@example.com"');
    expect(html).toContain(i18n.translationAndInterpretation.infoUrlText);
    expect(html).toContain(i18n.translationAndInterpretation.opensInNewTab);
  });

  test('renders external info link only when no translation contact details are provided', () => {
    const template = `
      {% from "components/translation-interpretation.njk" import translationInterpretation %}
      {{ translationInterpretation(courtTranslations, translationText) }}
    `;

    const html = env.renderString(template, {
      translationText: i18n.translationAndInterpretation,
      courtTranslations: [{ phoneNumber: '', email: '' }],
    });

    expect(html).toContain(i18n.translationAndInterpretation.infoUrlText);
    expect(html).not.toContain('href="tel:');
    expect(html).not.toContain('href="mailto:');
    expect(html).not.toContain(i18n.translationAndInterpretation.contactIntro);
  });
});
