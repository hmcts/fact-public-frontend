import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { Response } from 'express';

import ServiceSearchResultsController from '../../../main/controllers/ServiceSearchResultsController';
import { FactRequest } from '../../../main/interfaces/FactRequest';
import { SERVICE_AREA_TYPE, ServiceArea } from '../../../main/schemas/ServiceAreaSchema';
import { CATCHMENT_TYPES, CourtServiceAreas } from '../../../main/schemas/courtServiceAreas';

const mockGetCourtServiceAreas: jest.MockedFunction<
  (serviceAreaName: string) => Promise<CourtServiceAreas[] | undefined>
> = jest.fn();
const mockCalculateServiceNameFromSlug: jest.MockedFunction<(service: string) => Promise<string>> = jest.fn();
const mockCalculateServiceAreaFromSlug: jest.MockedFunction<
  (serviceName: string, area: string) => Promise<ServiceArea>
> = jest.fn();

jest.mock('../../../main/requests/DataApiRequests', () => {
  return {
    DataApiRequests: jest.fn().mockImplementation(() => ({
      getCourtServiceAreas: (serviceAreaName: string) => mockGetCourtServiceAreas(serviceAreaName),
    })),
  };
});
jest.mock('../../../main/utils/SchemaUtils', () => {
  return {
    calculateServiceNameFromSlug: (service: string) => mockCalculateServiceNameFromSlug(service),
    calculateServiceAreaFromSlug: (serviceName: string, area: string) =>
      mockCalculateServiceAreaFromSlug(serviceName, area),
  };
});

// Common base ServiceArea mock for tests
const BASE_SERVICE_AREA: ServiceArea = {
  slug: 'test-area',
  id: 'area-id',
  name: 'Test Area',
  nameCy: 'Ardal Brawf',
  description: null,
  descriptionCy: null,
  onlineUrl: '',
  onlineText: '',
  onlineTextCy: null,
  text: null,
  textCy: null,
  catchmentMethod: null,
  areaOfLawId: 'law-id',
  type: SERVICE_AREA_TYPE.CIVIL,
  sortOrder: null,
  hasLocal: true,
  hasNational: true,
  hasRegional: true,
};

// Common base CourtServiceAreas mocks for tests
const BASE_NATIONAL_COURT_SERVICE_AREA: CourtServiceAreas = {
  id: 'court-area-id-1',
  courtId: 'court-id-1',
  serviceAreaId: ['area-id'],
  catchmentType: CATCHMENT_TYPES.NATIONAL,
  courtName: 'National Court',
  courtSlug: 'national-court',
};

const BASE_LOCAL_COURT_SERVICE_AREA: CourtServiceAreas = {
  id: 'court-area-id-2',
  courtId: 'court-id-2',
  serviceAreaId: ['area-id'],
  catchmentType: CATCHMENT_TYPES.LOCAL,
  courtName: 'Local Court',
  courtSlug: 'local-court',
};

describe('ServiceSearchResultsController', () => {
  let req: Partial<FactRequest>;
  let res: Response;
  beforeEach(() => {
    req = {
      params: { service: 'test-service', serviceArea: 'test-area' },
      i18n: {
        getDataByLanguage: jest.fn().mockReturnValue({
          'service-results': { hint: 'Find a court for {serviceArea}' },
          'not-found': { title: 'Not Found' },
        }),
      } as unknown as FactRequest['i18n'],
      lng: 'en',
    };
    res = {
      render: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;
    mockGetCourtServiceAreas.mockReset();
    mockCalculateServiceNameFromSlug.mockReset();
    mockCalculateServiceAreaFromSlug.mockReset();
  });

  test('renders service-results with national catchment court and English hint', async () => {
    mockCalculateServiceNameFromSlug.mockResolvedValue('Test Service');
    mockCalculateServiceAreaFromSlug.mockResolvedValue({
      ...BASE_SERVICE_AREA,
      onlineUrl: 'http://online',
      onlineText: 'Online help',
      text: 'Hint for this service area',
    });
    mockGetCourtServiceAreas.mockResolvedValue([
      { ...BASE_NATIONAL_COURT_SERVICE_AREA },
      { ...BASE_LOCAL_COURT_SERVICE_AREA },
    ]);
    await new ServiceSearchResultsController().render(req as FactRequest, res);
    expect(res.render).toHaveBeenCalledWith(
      'service-results',
      expect.objectContaining({
        onlineText: 'Online help',
        onlineUrl: 'http://online',
        results: expect.objectContaining({ courtName: 'National Court' }),
        hint: 'Hint for this service area',
      })
    );
  });

  test('renders service-results with Welsh hint if lng is cy', async () => {
    req.lng = 'cy';
    mockCalculateServiceNameFromSlug.mockResolvedValue('Test Service');
    mockCalculateServiceAreaFromSlug.mockResolvedValue({
      ...BASE_SERVICE_AREA,
      onlineUrl: 'http://online',
      onlineText: 'Online help',
      text: null,
      textCy: 'Awgrym Cymraeg',
    });
    mockGetCourtServiceAreas.mockResolvedValue([{ ...BASE_NATIONAL_COURT_SERVICE_AREA }]);
    await new ServiceSearchResultsController().render(req as FactRequest, res);
    expect(res.render).toHaveBeenCalledWith(
      'service-results',
      expect.objectContaining({
        hint: 'Awgrym Cymraeg',
      })
    );
  });

  test('renders service-results with fallback Welsh hint if textCy is missing', async () => {
    req.lng = 'cy';
    mockCalculateServiceNameFromSlug.mockResolvedValue('Test Service');
    mockCalculateServiceAreaFromSlug.mockResolvedValue({
      ...BASE_SERVICE_AREA,
      onlineUrl: 'http://online',
      onlineText: 'Online help',
      text: 'Hint for this service area',
      textCy: null,
    });
    mockGetCourtServiceAreas.mockResolvedValue([{ ...BASE_NATIONAL_COURT_SERVICE_AREA }]);
    (req.i18n!.getDataByLanguage as unknown) = jest.fn().mockReturnValue({
      'service-results': { hint: 'Find a court for {serviceArea}' },
      'not-found': { title: 'Not Found' },
    });
    await new ServiceSearchResultsController().render(req as FactRequest, res);
    expect(res.render).toHaveBeenCalledWith(
      'service-results',
      expect.objectContaining({
        hint: 'Find a court for ardal brawf',
      })
    );
  });

  test('renders not-found if error is thrown', async () => {
    mockCalculateServiceNameFromSlug.mockRejectedValue(new Error('fail'));
    await new ServiceSearchResultsController().render(req as FactRequest, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.render).toHaveBeenCalledWith('not-found', expect.anything());
  });

  test('renders service-results with empty results if getCourtServiceAreas returns non-array', async () => {
    // current fact simply doesn't set a result in the payload for nunjuks when this happens
    // so that's what we're testing for here
    mockCalculateServiceNameFromSlug.mockResolvedValue('Test Service');
    mockCalculateServiceAreaFromSlug.mockResolvedValue({
      ...BASE_SERVICE_AREA,
    });
    mockGetCourtServiceAreas.mockResolvedValue(undefined);
    await new ServiceSearchResultsController().render(req as FactRequest, res);
    expect(res.render).toHaveBeenCalledWith(
      'service-results',
      expect.objectContaining({
        results: {},
      })
    );
  });

  test('renders service-results with empty results if no national catchment', async () => {
    mockCalculateServiceNameFromSlug.mockResolvedValue('Test Service');
    mockCalculateServiceAreaFromSlug.mockResolvedValue({
      ...BASE_SERVICE_AREA,
    });
    mockGetCourtServiceAreas.mockResolvedValue([{ ...BASE_LOCAL_COURT_SERVICE_AREA }]);
    await new ServiceSearchResultsController().render(req as FactRequest, res);
    expect(res.render).toHaveBeenCalledWith(
      'service-results',
      expect.objectContaining({
        results: {},
      })
    );
  });
});
