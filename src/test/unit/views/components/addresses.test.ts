import { env } from '../helpers/nunjucksEnv';

const i18n = require('../../../../main/locales/en/court.json');

describe('Addresses macro', () => {
  test('renders address summary list with directions link', () => {
    const template = `
      {% from "components/addresses.njk" import addresses %}
      {{ addresses(courtAddresses, addressesText) }}
    `;

    const html = env.renderString(template, {
      addressesText: i18n.addresses,
      courtAddresses: [
        {
          addressType: 'VISIT_US',
          formattedAddressLines: ['Line 1', 'Town', 'AB1 2CD'],
          formattedAddressTags: ['Tag 1'],
          directionsUrl: 'https://example.com/maps',
        },
      ],
    });

    expect(html).toContain(i18n.addresses.heading);
    expect(html).toContain('Line 1');
    expect(html).toContain(i18n.addresses.getDirectionsLink);
    expect(html).toContain('href="https://example.com/maps"');
  });
});
