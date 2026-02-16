import { env } from '../helpers/nunjucksEnv';

const i18n = require('../../../../main/locales/en/court.json');

describe('Opening hours macro', () => {
  test('renders opening hours summary list', () => {
    const template = `
      {% from "components/opening-hours.njk" import openingHours %}
      {{ openingHours(openingHoursByType, openingHoursText) }}
    `;

    const html = env.renderString(template, {
      openingHoursText: i18n.openingHours,
      openingHoursByType: [
        {
          typeName: 'Office',
          hours: [{ dayOfWeek: 'MONDAY', openingHour: '9:00am', closingHour: '5:00pm' }],
        },
      ],
    });

    expect(html).toContain(i18n.openingHours.heading);
    expect(html).toContain('Office');
    expect(html).toContain('Monday');
    expect(html).toContain('9:00am to 5:00pm');
  });
});
