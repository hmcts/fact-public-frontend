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
    expect(html).not.toContain('Drink vending machines');
    expect(html).not.toContain('A cafeteria serving hot and cold food');
    expect(html).toContain('Waiting areas');
    expect(html).toContain('Baby changing facility');
    expect(html).toContain('Security');
    expect(html).toContain('A quiet room is not available.');
    expect(html).not.toContain(
      'A quiet room is available for people of all faiths or none, for prayer, reflection or quiet.'
    );
    expect(html).toContain('Wifi is available.');
    expect(html).not.toContain('No Wifi at the court.');
  });

  test('renders unavailable rows and single-item food row when facilities are limited', () => {
    const template = `
      {% from "components/building-facilities.njk" import buildingFacilities %}
      {{ buildingFacilities(enquiriesPhoneNumber, facilities, buildingFacilitiesText) }}
    `;

    const html = env.renderString(template, {
      enquiriesPhoneNumber: '',
      buildingFacilitiesText: i18n.buildingFacilities,
      facilities: [
        {
          parking: false,
          freeWaterDispensers: false,
          snackVendingMachines: false,
          drinkVendingMachines: true,
          cafeteria: false,
          waitingArea: false,
          waitingAreaChildren: true,
          quietRoom: true,
          babyChanging: false,
          wifi: false,
        },
      ],
    });

    expect(html).toContain(i18n.buildingFacilities.contactFallback);
    expect(html).toContain(i18n.buildingFacilities.parkingUnavailable);
    expect(html).toContain(i18n.buildingFacilities.foodDrink);
    expect(html).toContain(i18n.buildingFacilities.waitingAreaChildrenAvailable);
    expect(html).toContain(i18n.buildingFacilities.quietRoomAvailable);
    expect(html).toContain(i18n.buildingFacilities.babyChangingUnavailable);
    expect(html).toContain(i18n.buildingFacilities.wifiUnavailable);
  });
});
