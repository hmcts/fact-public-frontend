import { ServiceArea } from '../../../main/schemas/ServiceAreaSchema';
import { Service } from '../../../main/schemas/ServiceSchema';
import { badResponseDataApiError } from '../mocks/dataApiError';

const mockGetServiceAreas = jest.fn();
const mockGetAllServices = jest.fn();

jest.mock('../../../main/requests/DataApiRequests', () => ({
  DataApiRequests: jest.fn().mockImplementation(() => ({
    getServiceAreas: mockGetServiceAreas,
    getAllServices: mockGetAllServices,
  })),
}));

const { calculateServiceAreaFromSlug, calculateServiceNameFromSlug } =
  require('../../../main/utils/SchemaUtils') as typeof import('../../../main/utils/SchemaUtils');

describe('SchemaUtils', () => {
  beforeEach(() => {
    mockGetServiceAreas.mockReset();
    mockGetAllServices.mockReset();
  });

  test('returns the service area for a matching slug', async () => {
    const serviceAreas: ServiceArea[] = [
      {
        id: 'sa-1',
        name: 'Family law',
        slug: 'family-law',
        nameCy: 'Cyfraith teulu',
        description: null,
        descriptionCy: null,
        onlineUrl: null,
        onlineText: null,
        onlineTextCy: null,
        text: null,
        textCy: null,
        catchmentMethod: null,
        areaOfLawId: 'aol-1',
        type: 'FAMILY' as ServiceArea['type'],
        sortOrder: null,
        hasLocal: true,
        hasNational: false,
        hasRegional: false,
      },
    ];
    mockGetServiceAreas.mockResolvedValue(serviceAreas);

    await expect(calculateServiceAreaFromSlug('Any Service', 'family-law')).resolves.toEqual(serviceAreas[0]);
  });

  test('throws when the service area slug cannot be found', async () => {
    mockGetServiceAreas.mockResolvedValue([]);

    await expect(calculateServiceAreaFromSlug('Any Service', 'missing')).rejects.toThrow('Service area not found');
  });

  test('propagates a service area dependency error', async () => {
    mockGetServiceAreas.mockResolvedValue(badResponseDataApiError);

    await expect(calculateServiceAreaFromSlug('Any Service', 'family-law')).rejects.toBe(badResponseDataApiError);
  });

  test('returns the service name for a matching service slug', async () => {
    const services: Service[] = [
      {
        id: 'svc-1',
        name: 'Money claims',
        slug: 'money-claims',
        nameCy: 'Hawliadau arian',
        description: null,
        descriptionCy: null,
        serviceAreas: ['family-law'],
      },
    ];
    mockGetAllServices.mockResolvedValue(services);

    await expect(calculateServiceNameFromSlug('money-claims')).resolves.toBe('Money claims');
  });

  test('throws when service slug cannot be found', async () => {
    mockGetAllServices.mockResolvedValue([]);

    await expect(calculateServiceNameFromSlug('missing')).rejects.toThrow('Service not found');
  });

  test('propagates a services dependency error', async () => {
    mockGetAllServices.mockResolvedValue(badResponseDataApiError);

    await expect(calculateServiceNameFromSlug('money-claims')).rejects.toBe(badResponseDataApiError);
  });
});
