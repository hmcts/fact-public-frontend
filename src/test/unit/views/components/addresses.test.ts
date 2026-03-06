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

  test('renders multiple address types and omits directions link when missing', () => {
    const template = `
      {% from "components/addresses.njk" import addresses %}
      {{ addresses(courtAddresses, addressesText) }}
    `;

    const html = env.renderString(template, {
      addressesText: i18n.addresses,
      courtAddresses: [
        {
          addressType: 'VISIT_OR_CONTACT_US',
          formattedAddressLines: ['Line A', 'Town A', 'AA1 1AA'],
          formattedAddressTags: [],
          directionsUrl: null,
        },
        {
          addressType: 'UNMAPPED_TYPE',
          formattedAddressLines: ['Line B', 'Town B', 'BB1 1BB'],
          formattedAddressTags: ['Tag B'],
          directionsUrl: null,
        },
      ],
    });

    expect(html).toContain(i18n.addresses.addressTypes.VISIT_OR_CONTACT_US);
    expect(html).toContain('UNMAPPED_TYPE');
    expect(html).toContain('Tag B');
    expect(html).not.toContain(i18n.addresses.getDirectionsLink);
  });
});
