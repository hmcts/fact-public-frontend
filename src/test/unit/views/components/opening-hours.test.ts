import { env } from '../helpers/nunjucksEnv';

const i18nCy = require('../../../../main/locales/cy/court.json');
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
      counterService: [
        {
          courtTypes: [{ name: 'Civil' }, { name: 'Family' }],
          assistWithForms: true,
          assistWithDocuments: true,
          assistWithSupport: true,
          appointmentNeeded: true,
          appointmentEmail: null,
          appointmentPhone: '0118 987 6777',
          counterOpenHours: [{ dayOfWeek: 'MONDAY', openingHour: '9:00am', closingHour: '4:30pm' }],
        },
      ],
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
    expect(html.match(/govuk-summary-list__row/g)).toHaveLength(2);
  });

  test('renders each counter service as one combined row', () => {
    const template = `
      {% from "components/opening-hours.njk" import openingHours %}
      {{ openingHours(openingHoursByType, counterServices, openingHoursText, language) }}
    `;

    const html = env.renderString(template, {
      openingHoursText: i18n.openingHours,
      openingHoursByType: [],
      counterServices: [
        {
          courtTypes: [{ name: 'Civil' }],
          assistWithForms: true,
          assistWithDocuments: false,
          assistWithSupport: false,
          appointmentNeeded: false,
          appointmentEmail: null,
          appointmentPhone: null,
          counterOpenHours: [{ dayOfWeek: 'MONDAY', openingHour: '9:00am', closingHour: '4:30pm' }],
        },
        {
          courtTypes: [{ name: 'Family' }],
          assistWithForms: false,
          assistWithDocuments: true,
          assistWithSupport: false,
          appointmentNeeded: true,
          appointmentEmail: 'family@example.com',
          appointmentPhone: null,
          counterOpenHours: [{ dayOfWeek: 'TUESDAY', openingHour: '10:00am', closingHour: '3:00pm' }],
        },
      ],
      language: 'en',
    });

    expect(html.match(/govuk-summary-list__row/g)).toHaveLength(2);
    expect(html).toContain('Counter service for Civil');
    expect(html).toContain('Counter service for Family');
    expect(html).toContain('Monday 9:00am to 4:30pm');
    expect(html).toContain('Tuesday 10:00am to 3:00pm');
  });

  test('renders counter service title with court types in Welsh page using default name', () => {
    const template = `
      {% from "components/opening-hours.njk" import openingHours %}
      {{ openingHours(openingHoursByType, counterService, openingHoursText, language) }}
    `;

    const html = env.renderString(template, {
      openingHoursText: i18n.openingHours,
      openingHoursByType: [],
      counterService: [
        {
          courtTypes: [{ name: 'Civil' }],
          assistWithForms: true,
          assistWithDocuments: false,
          assistWithSupport: false,
          appointmentNeeded: false,
          appointmentEmail: null,
          appointmentPhone: null,
          counterOpenHours: [{ dayOfWeek: 'MONDAY', openingHour: '9:00am', closingHour: '4:30pm' }],
        },
      ],
      language: 'cy',
    });

    expect(html).toContain('Counter service for Civil');
  });

  test('renders Welsh range separator for opening times', () => {
    const template = `
      {% from "components/opening-hours.njk" import openingHours %}
      {{ openingHours(openingHoursByType, counterService, openingHoursText, language) }}
    `;

    const html = env.renderString(template, {
      openingHoursText: i18nCy.openingHours,
      openingHoursByType: [
        {
          typeName: 'Swyddfa',
          hours: [{ dayOfWeek: 'MONDAY', openingHour: '9:00yb', closingHour: '5:00yh' }],
        },
      ],
      counterService: [],
      language: 'cy',
    });

    expect(html).toContain('Dydd Llun 9:00yb i 5:00yh');
  });

  test('renders counter opening times in the counter service row when all help flags are false', () => {
    const template = `
      {% from "components/opening-hours.njk" import openingHours %}
      {{ openingHours(openingHoursByType, counterService, openingHoursText, language) }}
    `;

    const html = env.renderString(template, {
      openingHoursText: i18n.openingHours,
      openingHoursByType: [],
      counterService: [
        {
          courtTypes: [{ name: 'Civil' }],
          assistWithForms: false,
          assistWithDocuments: false,
          assistWithSupport: false,
          appointmentNeeded: false,
          appointmentEmail: null,
          appointmentPhone: null,
          counterOpenHours: [{ dayOfWeek: 'MONDAY', openingHour: '9:00am', closingHour: '4:30pm' }],
        },
      ],
      language: 'en',
    });

    expect(html).toContain(i18n.openingHours.counterService.counterOpen);
    expect(html).toContain('Monday 9:00am to 4:30pm');
    expect(html).not.toContain(i18n.openingHours.counterService.getHelpAbout);
    expect(html).toContain('Counter service for Civil');
  });

  test('renders counter service row with partial help items when times are missing', () => {
    const template = `
      {% from "components/opening-hours.njk" import openingHours %}
      {{ openingHours(openingHoursByType, counterService, openingHoursText, language) }}
    `;

    const html = env.renderString(template, {
      openingHoursText: i18n.openingHours,
      openingHoursByType: [],
      counterService: [
        {
          courtTypes: [],
          assistWithForms: true,
          assistWithDocuments: false,
          assistWithSupport: false,
          appointmentNeeded: false,
          appointmentEmail: null,
          appointmentPhone: null,
          counterOpenHours: [],
        },
      ],
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
      counterService: [
        {
          courtTypes: [],
          assistWithForms: true,
          assistWithDocuments: false,
          assistWithSupport: false,
          appointmentNeeded: true,
          appointmentEmail: null,
          appointmentPhone: null,
          counterOpenHours: [],
        },
      ],
      language: 'en',
    });

    expect(html).toContain(i18n.openingHours.counterService.appointmentRequiredPrefix);
    expect(html).toContain(i18n.openingHours.counterService.appointmentRequiredSuffix);
    expect(html).not.toContain('phone-link');
    expect(html).not.toContain(i18n.openingHours.counterService.appointmentNotNeeded);
  });

  describe('appointment booking contact', () => {
    const renderAppointment = (
      appointmentEmail: string | null,
      appointmentPhone: string | null,
      text = i18n.openingHours
    ): string => {
      const template = `
        {% from "components/opening-hours.njk" import openingHours %}
        {{ openingHours(openingHoursByType, counterService, openingHoursText, language) }}
      `;

      const html = env.renderString(template, {
        openingHoursText: text,
        openingHoursByType: [],
        counterService: [
          {
            courtTypes: [],
            assistWithForms: true,
            assistWithDocuments: false,
            assistWithSupport: false,
            appointmentNeeded: true,
            appointmentEmail,
            appointmentPhone,
            counterOpenHours: [],
          },
        ],
        language: 'en',
      });

      const paragraph = html.match(/<p class="govuk-body govuk-!-margin-bottom-3">([\s\S]*?)<\/p>/);
      return (paragraph ? paragraph[1] : '')
        .replace(/<span class="phone-text">[^<]*<\/span>/g, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    test('shows only the email address when no phone number is set', () => {
      expect(renderAppointment('book@example.com', null)).toBe(
        'Available by appointment only. Book an appointment by contacting book@example.com.'
      );
    });

    test('shows only the phone number when no email address is set', () => {
      expect(renderAppointment(null, '0118 987 6777')).toBe(
        'Available by appointment only. Book an appointment by contacting 0118 987 6777.'
      );
    });

    test('shows the email address or phone number when both are set', () => {
      expect(renderAppointment('book@example.com', '0118 987 6777')).toBe(
        'Available by appointment only. Book an appointment by contacting book@example.com or 0118 987 6777.'
      );
    });

    test('uses the Welsh word for "or" on the Welsh page', () => {
      expect(renderAppointment('book@example.com', '0118 987 6777', i18nCy.openingHours)).toBe(
        'Ar gael drwy apwyntiad yn unig. Trefnwch apwyntiad drwy gysylltu â book@example.com neu 0118 987 6777.'
      );
    });
  });
});
