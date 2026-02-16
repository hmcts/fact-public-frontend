import { env } from '../helpers/nunjucksEnv';

const i18n = require('../../../../main/locales/en/court.json');

describe('Building facilities macro', () => {
  test('renders facilities summary list', () => {
    const template = `
      {% from "components/building-facilities.njk" import buildingFacilities %}
      {{ buildingFacilities(enquiriesPhoneNumber, facilities, buildingFacilitiesText) }}
    `;

    const html = env.renderString(template, {
      enquiriesPhoneNumber: '0300 123 4567',
      buildingFacilitiesText: i18n.buildingFacilities,
      facilities: [
        {
          parking: true,
          freeWaterDispensers: true,
          snackVendingMachines: true,
          drinkVendingMachines: false,
          cafeteria: false,
          waitingArea: true,
          waitingAreaChildren: true,
          quietRoom: false,
          babyChanging: true,
          wifi: true,
        },
      ],
    });

    expect(html).toContain('Parking is available.');
    expect(html).toContain('Toilets are available at the court.');
    expect(html).toContain('Facilities include:');
    expect(html).toContain('Free water dispensers');
    expect(html).toContain('Snack vending machines');
    expect(html).toContain('Waiting areas');
    expect(html).toContain('Baby changing facility');
    expect(html).toContain('Security');
    expect(html).toContain('Wifi is available.');
  });
});
