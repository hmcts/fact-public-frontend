import { CATCHMENT_METHOD, SERVICE_AREA_TYPE, serviceAreaSchema } from '../../../main/schemas/ServiceAreaSchema';
import { serviceSchema } from '../../../main/schemas/ServiceSchema';
import { courtBasicSchema } from '../../../main/schemas/courtBasicSchema';

describe('service-related schemas', () => {
  test('serviceSchema derives slug from service name', () => {
    const parsed = serviceSchema.parse({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Adoption, Family Matters',
      slug: 'should-be-overwritten',
      nameCy: 'Mabwysiadu',
      description: null,
      descriptionCy: null,
      serviceAreas: ['family'],
    });

    expect(parsed.slug).toBe('adoption-family-matters');
  });

  test('serviceAreaSchema derives slug from area name', () => {
    const parsed = serviceAreaSchema.parse({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Children, Family Law',
      slug: 'ignored',
      nameCy: 'Plant',
      description: null,
      descriptionCy: null,
      onlineUrl: null,
      onlineText: null,
      onlineTextCy: null,
      text: null,
      textCy: null,
      catchmentMethod: CATCHMENT_METHOD.POSTCODE,
      areaOfLawId: '22222222-2222-4222-8222-222222222222',
      type: SERVICE_AREA_TYPE.FAMILY,
      sortOrder: 1,
      hasLocal: true,
      hasNational: false,
      hasRegional: false,
    });

    expect(parsed.slug).toBe('children-family-law');
  });

  test('courtBasicSchema accepts optional service centre metadata', () => {
    const parsed = courtBasicSchema.parse({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Test Court',
      slug: 'test-court',
      open: true,
      warningNotice: null,
      warningNoticeCy: null,
      createdAt: '2026-09-15T00:00:00.000Z',
      lastUpdatedAt: '2026-09-15T12:00:00.000Z',
      openOnCath: null,
      mrdId: null,
      regionId: '55555555-5555-4555-8555-555555555555',
      serviceCentre: true,
      locationType: 'SERVICE_CENTRE',
    });

    expect(parsed.serviceCentre).toBe(true);
    expect(parsed.locationType).toBe('SERVICE_CENTRE');
  });
});
