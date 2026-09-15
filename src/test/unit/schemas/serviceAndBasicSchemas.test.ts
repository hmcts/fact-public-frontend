import { CATCHMENT_METHOD, SERVICE_AREA_TYPE, serviceAreaSchema } from '../../../main/schemas/ServiceAreaSchema';
import { serviceSchema } from '../../../main/schemas/ServiceSchema';
import { courtBasicSchema } from '../../../main/schemas/courtBasicSchema';

describe('service-related schemas', () => {
  test('serviceSchema derives slug from service name', () => {
    const parsed = serviceSchema.parse({
      id: 'service-1',
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
      id: 'area-1',
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
      areaOfLawId: 'aol-1',
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
      id: 'court-1',
      name: 'Test Court',
      slug: 'test-court',
      open: true,
      warningNotice: null,
      warningNoticeCy: null,
      lastUpdatedAt: '2026-09-15T12:00:00.000Z',
      openOnCath: null,
      mrdId: null,
      region: 'London',
      serviceCentre: true,
      locationType: 'SERVICE_CENTRE',
    });

    expect(parsed.serviceCentre).toBe(true);
    expect(parsed.locationType).toBe('SERVICE_CENTRE');
  });
});
