import { env } from '../helpers/nunjucksEnv';

const i18n = require('../../../../main/locales/en/court.json');

describe('Contact details macro', () => {
  test('renders enquiries first and includes phone/email rows', () => {
    const template = `
      {% from "components/contact-details.njk" import contactDetails %}
      {{ contactDetails(courtContactDetails, contactDetailsText, language) }}
    `;

    const html = env.renderString(template, {
      language: 'en',
      contactDetailsText: i18n.contactDetails,
      courtContactDetails: [
        {
          courtContactDescriptionId: '2',
          explanation: 'Expl A',
          explanationCy: '',
          email: 'a@example.com',
          phoneNumber: '01234',
          courtContactDescription: { name: 'Other', nameCy: 'Arall' },
        },
        {
          courtContactDescriptionId: '1',
          explanation: 'Expl B',
          explanationCy: '',
          email: 'b@example.com',
          phoneNumber: '05678',
          courtContactDescription: { name: 'Enquiries', nameCy: 'Ymholiadau' },
        },
      ],
    });

    const enquiriesIndex = html.indexOf('Enquiries');
    const otherIndex = html.indexOf('Other');
    expect(enquiriesIndex).toBeGreaterThan(-1);
    expect(otherIndex).toBeGreaterThan(-1);
    expect(enquiriesIndex).toBeLessThan(otherIndex);
    expect(html).toContain('href="tel:05678"');
    expect(html).toContain('href="mailto:b@example.com"');
  });

  test('renders contact headings without links when phone and email are missing', () => {
    const template = `
      {% from "components/contact-details.njk" import contactDetails %}
      {{ contactDetails(courtContactDetails, contactDetailsText, language) }}
    `;

    const html = env.renderString(template, {
      language: 'en',
      contactDetailsText: i18n.contactDetails,
      courtContactDetails: [
        {
          courtContactDescriptionId: '3',
          explanation: 'General queries',
          explanationCy: '',
          email: '',
          phoneNumber: '',
          courtContactDescription: { name: 'General', nameCy: 'Cyffredinol' },
        },
      ],
    });

    expect(html).toContain('General');
    expect(html).toContain('General queries');
    expect(html).not.toContain('href="tel:');
    expect(html).not.toContain('href="mailto:');
    expect(html).not.toContain(i18n.contactDetails.telephone);
    expect(html).not.toContain(i18n.contactDetails.email);
  });

  test('renders service-centre descriptions and bilingual explanations', () => {
    const template = `
      {% from "components/contact-details.njk" import contactDetails %}
      {{ contactDetails(serviceCentreContactDetails, contactDetailsText, language, "serviceCentreContactDescription") }}
    `;

    const html = env.renderString(template, {
      language: 'cy',
      contactDetailsText: i18n.contactDetails,
      serviceCentreContactDetails: [
        {
          explanation: 'English explanation',
          explanationCy: 'Esboniad Cymraeg',
          email: 'service@example.com',
          phoneNumber: '0300 123 4567',
          serviceCentreContactDescription: { name: 'Enquiries', nameCy: 'Ymholiadau' },
        },
      ],
    });

    expect(html).toContain('Ymholiadau');
    expect(html).toContain('Esboniad Cymraeg');
    expect(html).not.toContain('English explanation');
    expect(html).toContain('href="tel:0300 123 4567"');
    expect(html).toContain('href="mailto:service@example.com"');
  });
});
