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
});
