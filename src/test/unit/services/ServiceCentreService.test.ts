import { ServiceCentreDetails } from '../../../main/schemas/allLocationDetails';
import { ServiceCentreService } from '../../../main/services/ServiceCentreService';

const buildServiceCentre = (overrides: Partial<ServiceCentreDetails> = {}): ServiceCentreDetails => ({
  id: 'service-centre-id',
  name: 'Test Service Centre',
  slug: 'test-service-centre',
  open: true,
  warningNotice: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  lastUpdatedAt: '2024-01-15T10:00:00.000Z',
  regionId: 'region-id',
  serviceAreas: [],
  catchmentType: null,
  serviceCentreAddresses: [],
  serviceCentreContactDetails: [],
  serviceCentreAreasOfLaw: [],
  ...overrides,
});

describe('ServiceCentreService', () => {
  test.each([
    ['en', '15 January 2024'],
    ['cy', '15 Ionawr 2024'],
  ])('formats the reviewed date for %s', (language, expectedDate) => {
    const result = new ServiceCentreService().formatData(buildServiceCentre(), language);

    expect(result.lastUpdatedAt).toBe(expectedDate);
  });

  test('formats nullable address fields without court-only tags', () => {
    const serviceCentre = buildServiceCentre({
      serviceCentreAddresses: [
        {
          addressLine1: '1 Service Street',
          addressLine2: null,
          townCity: 'London',
          county: '',
          postcode: 'SW1A 1AA',
          lat: 51.501,
          lon: -0.141,
          addressType: 'VISIT_US',
        },
      ],
    });

    const result = new ServiceCentreService().formatData(serviceCentre, 'en');

    expect(result.serviceCentreAddresses[0]).toMatchObject({
      formattedAddressLines: ['1 Service Street', 'London', 'SW1A 1AA'],
      formattedAddressTags: [],
      directionsUrl: 'https://www.google.com/maps?q=51.501,-0.141',
    });
  });

  test.each(['WRITE_TO_US', 'VISIT_OR_CONTACT_US'])('does not create directions for %s addresses', addressType => {
    const serviceCentre = buildServiceCentre({
      serviceCentreAddresses: [
        {
          addressLine1: null,
          addressLine2: null,
          townCity: null,
          county: null,
          postcode: null,
          lat: 51.501,
          lon: -0.141,
          addressType,
        },
      ],
    });

    const result = new ServiceCentreService().formatData(serviceCentre, 'en');

    expect(result.serviceCentreAddresses[0].formattedAddressLines).toEqual([]);
    expect(result.serviceCentreAddresses[0].directionsUrl).toBeNull();
  });

  test('normalizes missing optional arrays and date', () => {
    const result = new ServiceCentreService().formatData(
      buildServiceCentre({
        lastUpdatedAt: null,
        serviceCentreAddresses: null,
        serviceCentreContactDetails: null,
        serviceCentreAreasOfLaw: null,
      }),
      'en'
    );

    expect(result.lastUpdatedAt).toBe('');
    expect(result.serviceCentreAddresses).toEqual([]);
    expect(result.serviceCentreContactDetails).toEqual([]);
    expect(result.serviceCentreAreasOfLaw).toEqual([]);
  });

  test('normalizes missing nested areas of law', () => {
    const result = new ServiceCentreService().formatData(
      buildServiceCentre({
        serviceCentreAreasOfLaw: [{ id: 'group-id', serviceCentreId: 'service-centre-id', areasOfLaw: null }],
      }),
      'en'
    );

    expect(result.serviceCentreAreasOfLaw).toEqual([
      { id: 'group-id', serviceCentreId: 'service-centre-id', areasOfLaw: [] },
    ]);
  });
});
