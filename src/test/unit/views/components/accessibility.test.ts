import { env } from '../helpers/nunjucksEnv';

const i18n = require('../../../../main/locales/en/court.json');

describe('Accessibility macro', () => {
  test('renders summary list rows and uses enquiries phone', () => {
    const template = `
      {% from "components/accessibility.njk" import accessibility %}
      {{ accessibility(enquiriesPhoneNumber, accessibilityOptions, accessibilityText, language) }}
    `;

    const html = env.renderString(template, {
      language: 'en',
      enquiriesPhoneNumber: '02070000000',
      accessibilityText: i18n.accessibility,
      accessibilityOptions: [
        {
          accessibleParking: true,
          accessibleParkingPhoneNumber: '01111',
          accessibleToiletDescription: 'Accessible toilet available.',
          accessibleToiletDescriptionCy: '',
          accessibleEntrance: false,
          accessibleEntrancePhoneNumber: '02222',
          hearingEnhancementEquipment: 'INFRARED_SYSTEMS',
          lift: true,
          liftDoorWidth: 90,
          liftDoorLimit: 1000,
          quietRoom: true,
        },
      ],
    });

    expect(html).toContain('Accessible parking');
    expect(html).toContain('Accessible toilet available.');
    expect(html).toContain('No step free access between the street and the courtrooms.');
    expect(html).not.toContain('Step free access between the street and the courtrooms.');
    expect(html).toContain('Infrared systems are available at this court.');
    expect(html).toContain('Courtrooms accessible by lift');
    expect(html).not.toContain('Lifts are not available.');
    expect(html).toContain('Quiet room');
    expect(html).not.toContain('A quiet room is not available.');
    expect(html).toContain('href="tel:02070000000"');
  });

  test('renders unavailable and fallback rows when key accessibility options are false', () => {
    const template = `
      {% from "components/accessibility.njk" import accessibility %}
      {{ accessibility(enquiriesPhoneNumber, accessibilityOptions, accessibilityText, language) }}
    `;

    const html = env.renderString(template, {
      language: 'en',
      enquiriesPhoneNumber: '',
      accessibilityText: i18n.accessibility,
      accessibilityOptions: [
        {
          accessibleParking: false,
          accessibleParkingPhoneNumber: null,
          accessibleToiletDescription: '',
          accessibleToiletDescriptionCy: '',
          accessibleEntrance: true,
          accessibleEntrancePhoneNumber: null,
          hearingEnhancementEquipment: 'HEARING_LOOP_SYSTEMS',
          lift: false,
          liftDoorWidth: null,
          liftDoorLimit: null,
          quietRoom: false,
        },
      ],
    });

    expect(html).toContain(i18n.accessibility.contactFallback);
    expect(html).toContain(i18n.accessibility.accessibleParkingUnavailable);
    expect(html).toContain(i18n.accessibility.accessibleEntranceAvailable);
    expect(html).toContain(i18n.accessibility.hearingEnhancementLoop);
    expect(html).toContain(i18n.accessibility.liftUnavailableFallback);
    expect(html).toContain(i18n.accessibility.quietRoomUnavailable);
  });
});
