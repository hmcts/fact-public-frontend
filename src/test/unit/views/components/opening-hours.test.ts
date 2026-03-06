import { env } from '../helpers/nunjucksEnv';

const i18n = require('../../../../main/locales/en/court.json');

describe('Opening hours macro', () => {
  test('renders opening hours summary list', () => {
    const template = `
      {% from "components/opening-hours.njk" import openingHours %}
      {{ openingHours(openingHoursByType, counterService, openingHoursText, language) }}
    `;

    const html = env.renderString(template, {
      openingHoursText: i18n.openingHours,
      openingHoursByType: [
        {
          typeName: 'Office',
          hours: [{ dayOfWeek: 'MONDAY', openingHour: '9:00am', closingHour: '5:00pm' }],
        },
      ],
      counterService: {
        courtTypes: [{ name: 'Civil' }, { name: 'Family' }],
        assistWithForms: true,
        assistWithDocuments: true,
        assistWithSupport: true,
        appointmentNeeded: true,
        appointmentContact: '0118 987 6777',
        appointmentContactIsPhone: true,
        counterOpenHours: [{ dayOfWeek: 'MONDAY', openingHour: '9:00am', closingHour: '4:30pm' }],
      },
      language: 'en',
    });

    expect(html).toContain(i18n.openingHours.heading);
    expect(html).toContain('Office');
    expect(html).toContain('Monday');
    expect(html).toContain('9:00am to 5:00pm');
    expect(html).toContain('Counter service for Civil, Family');
    expect(html).toContain(i18n.openingHours.counterService.getHelpAbout);
    expect(html).toContain(i18n.openingHours.counterService.helpItems.forms);
    expect(html).toContain(i18n.openingHours.counterService.helpItems.documents);
    expect(html).toContain(i18n.openingHours.counterService.helpItems.support);
    expect(html).toContain(i18n.openingHours.counterService.counterOpen);
    expect(html).toContain('9:00am to 4:30pm');
    expect(html).toContain('phone-text');
    expect(html).toContain('phone-link');
  });

  test('renders counter service title with court types in Welsh page using default name', () => {
    const template = `
      {% from "components/opening-hours.njk" import openingHours %}
      {{ openingHours(openingHoursByType, counterService, openingHoursText, language) }}
    `;

    const html = env.renderString(template, {
      openingHoursText: i18n.openingHours,
      openingHoursByType: [],
      counterService: {
        courtTypes: [{ name: 'Civil' }],
        assistWithForms: true,
        assistWithDocuments: false,
        assistWithSupport: false,
        appointmentNeeded: false,
        appointmentContact: null,
        appointmentContactIsPhone: false,
        counterOpenHours: [{ dayOfWeek: 'MONDAY', openingHour: '9:00am', closingHour: '4:30pm' }],
      },
      language: 'cy',
    });

    expect(html).toContain('Counter service for Civil');
  });

  test('renders counter open row without counter service row when all help flags are false', () => {
    const template = `
      {% from "components/opening-hours.njk" import openingHours %}
      {{ openingHours(openingHoursByType, counterService, openingHoursText, language) }}
    `;

    const html = env.renderString(template, {
      openingHoursText: i18n.openingHours,
      openingHoursByType: [],
      counterService: {
        courtTypes: [{ name: 'Civil' }],
        assistWithForms: false,
        assistWithDocuments: false,
        assistWithSupport: false,
        appointmentNeeded: false,
        appointmentContact: null,
        appointmentContactIsPhone: false,
        counterOpenHours: [{ dayOfWeek: 'MONDAY', openingHour: '9:00am', closingHour: '4:30pm' }],
      },
      language: 'en',
    });

    expect(html).toContain(i18n.openingHours.counterService.counterOpen);
    expect(html).toContain('Monday 9:00am to 4:30pm');
    expect(html).not.toContain(i18n.openingHours.counterService.getHelpAbout);
    expect(html).not.toContain('Counter service for Civil');
  });

  test('renders counter service row with partial help items and no counter open row when times are missing', () => {
    const template = `
      {% from "components/opening-hours.njk" import openingHours %}
      {{ openingHours(openingHoursByType, counterService, openingHoursText, language) }}
    `;

    const html = env.renderString(template, {
      openingHoursText: i18n.openingHours,
      openingHoursByType: [],
      counterService: {
        courtTypes: [],
        assistWithForms: true,
        assistWithDocuments: false,
        assistWithSupport: false,
        appointmentNeeded: false,
        appointmentContact: null,
        appointmentContactIsPhone: false,
        counterOpenHours: [],
      },
      language: 'en',
    });

    expect(html).toContain(i18n.openingHours.counterService.title);
    expect(html).toContain(i18n.openingHours.counterService.getHelpAbout);
    expect(html).toContain(i18n.openingHours.counterService.helpItems.forms);
    expect(html).not.toContain(i18n.openingHours.counterService.helpItems.documents);
    expect(html).not.toContain(i18n.openingHours.counterService.helpItems.support);
    expect(html).toContain(i18n.openingHours.counterService.appointmentNotNeeded);
    expect(html).not.toContain(i18n.openingHours.counterService.counterOpen);
  });

  test('renders appointment required text without contact when appointment is needed but no contact is provided', () => {
    const template = `
      {% from "components/opening-hours.njk" import openingHours %}
      {{ openingHours(openingHoursByType, counterService, openingHoursText, language) }}
    `;

    const html = env.renderString(template, {
      openingHoursText: i18n.openingHours,
      openingHoursByType: [],
      counterService: {
        courtTypes: [],
        assistWithForms: true,
        assistWithDocuments: false,
        assistWithSupport: false,
        appointmentNeeded: true,
        appointmentContact: '',
        appointmentContactIsPhone: false,
        counterOpenHours: [],
      },
      language: 'en',
    });

    expect(html).toContain(i18n.openingHours.counterService.appointmentRequiredPrefix);
    expect(html).toContain(i18n.openingHours.counterService.appointmentRequiredSuffix);
    expect(html).not.toContain('phone-link');
    expect(html).not.toContain(i18n.openingHours.counterService.appointmentNotNeeded);
  });
});
