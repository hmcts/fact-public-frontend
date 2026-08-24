import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { HttpStatusCode } from 'axios';
import { Response } from 'express';

import { ChooseServiceAreaController } from '../../../main/controllers/ChooseServiceAreaController';
import { FactRequest } from '../../../main/interfaces/FactRequest';
import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import { CATCHMENT_METHOD, SERVICE_AREA_TYPE, ServiceArea } from '../../../main/schemas/ServiceAreaSchema';
import { Service } from '../../../main/schemas/ServiceSchema';
import { calculateServiceAreaFromSlug, calculateServiceNameFromSlug } from '../../../main/utils/SchemaUtils';

jest.mock('../../../main/utils/SchemaUtils', () => ({
  calculateServiceAreaFromSlug: jest.fn(),
  calculateServiceNameFromSlug: jest.fn(),
}));

const mockGetAllServices: jest.MockedFunction<() => Promise<Service[] | HttpStatusCode>> = jest.fn();
const mockGetServiceAreas: jest.MockedFunction<() => Promise<ServiceArea[] | HttpStatusCode>> = jest.fn();

const mockService: Service = {
  id: 'service-1',
  name: 'Test Service',
  slug: 'test-service',
  nameCy: 'Gwasanaeth Prawf',
  description: 'A test service',
  descriptionCy: 'Gwasanaeth prawf',
  serviceAreas: ['area-1', 'area-2'],
};

const mockServiceArea: ServiceArea = {
  id: 'area-1',
  name: 'Area 1',
  slug: 'area-1-slug',
  nameCy: 'Ardal 1',
  description: 'Area 1 desc',
  descriptionCy: 'Ardal 1 desc',
  onlineUrl: 'https://example.com/area-1',
  onlineText: 'Area 1 Online',
  onlineTextCy: 'Ardal 1 Ar-lein',
  text: 'Area 1 info',
  textCy: 'Ardal 1 info',
  catchmentMethod: CATCHMENT_METHOD.POSTCODE,
  areaOfLawId: 'law-1',
  type: SERVICE_AREA_TYPE.CIVIL,
  sortOrder: 1,
  hasLocal: false,
  hasNational: true,
  hasRegional: false,
};

const mockServiceArea2: ServiceArea = {
  id: 'area-2',
  name: 'Area 2',
  slug: 'area-2-slug',
  nameCy: 'Ardal 2',
  description: 'Area 2 desc',
  descriptionCy: 'Ardal 2 desc',
  onlineUrl: 'https://example.com/area-2',
  onlineText: 'Area 2 Online',
  onlineTextCy: 'Ardal 2 Ar-lein',
  text: 'Area 2 info',
  textCy: 'Ardal 2 info',
  catchmentMethod: CATCHMENT_METHOD.POSTCODE,
  areaOfLawId: 'law-2',
  type: SERVICE_AREA_TYPE.FAMILY,
  sortOrder: 2,
  hasLocal: true,
  hasNational: true,
  hasRegional: false,
};

const mockServiceArea3: ServiceArea = {
  id: 'area-3',
  name: 'Area 3',
  slug: 'area-3-slug',
  nameCy: 'Ardal 3',
  description: 'Area 3 desc',
  descriptionCy: 'Ardal 3 desc',
  onlineUrl: 'https://example.com/area-3',
  onlineText: 'Area 3 Online',
  onlineTextCy: 'Ardal 3 Ar-lein',
  text: 'Area 3 info',
  textCy: 'Ardal 3 info',
  catchmentMethod: CATCHMENT_METHOD.POSTCODE,
  areaOfLawId: 'law-3',
  type: SERVICE_AREA_TYPE.FAMILY,
  sortOrder: 3,
  hasLocal: true,
  hasNational: false,
  hasRegional: false,
};

const dataApiRequests = {
  getAllServices: mockGetAllServices,
  getServiceAreas: mockGetServiceAreas,
} as unknown as DataApiRequests;
const calculateServiceNameFromSlugMock = calculateServiceNameFromSlug as jest.MockedFunction<
  typeof calculateServiceNameFromSlug
>;
const calculateServiceAreaFromSlugMock = calculateServiceAreaFromSlug as jest.MockedFunction<
  typeof calculateServiceAreaFromSlug
>;

describe('ChooseServiceAreaController', () => {
  let req: Partial<FactRequest>;
  let res: Response;
  let controller: ChooseServiceAreaController;

  beforeEach(() => {
    req = {
      i18n: {
        getDataByLanguage: jest.fn().mockReturnValue({
          'choose-service-area': { title: 'Choose Service Area' },
          'not-found': { title: 'Not Found' },
        }),
      } as unknown as FactRequest['i18n'],
      lng: 'en',
      params: { action: 'nearest', service: 'test-service' },
      body: {},
    };
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;
    mockGetAllServices.mockReset();
    mockGetServiceAreas.mockReset();
    calculateServiceNameFromSlugMock.mockResolvedValue(mockService.name);
    calculateServiceAreaFromSlugMock.mockImplementation(async (_service, area) => {
      const serviceArea = [mockServiceArea, mockServiceArea2, mockServiceArea3].find(
        candidate => candidate.slug === area
      );
      if (!serviceArea) {
        throw new Error('Service area not found');
      }
      return serviceArea;
    });
    controller = new ChooseServiceAreaController(dataApiRequests);
  });

  test('renders choose-service-area page with multiple areas', async () => {
    mockGetAllServices.mockResolvedValue([mockService]);
    mockGetServiceAreas.mockResolvedValue([mockServiceArea, mockServiceArea2, mockServiceArea3]);
    await controller.render(req as FactRequest, res);
    expect(res.render).toHaveBeenCalledWith(
      'choose-service-area',
      expect.objectContaining({ title: 'Choose Service Area' })
    );
  });

  test('redirects to search-results page if only one area, action is nearest and only national results are available', async () => {
    mockGetAllServices.mockResolvedValue([mockService]);
    mockGetServiceAreas.mockResolvedValue([mockServiceArea]);
    req.params = { action: 'nearest', service: 'test-service' };
    await controller.render(req as FactRequest, res);
    expect(res.redirect).toHaveBeenCalledWith('/services/test-service/area-1-slug/search-results');
  });

  test('redirects to postcode page if only one area, action is nearest and local results are available', async () => {
    mockGetAllServices.mockResolvedValue([mockService]);
    mockGetServiceAreas.mockResolvedValue([mockServiceArea2]);
    req.params = { action: 'nearest', service: 'test-service' };
    await controller.render(req as FactRequest, res);
    expect(res.redirect).toHaveBeenCalledWith(
      `/services/test-service/${mockServiceArea2.slug}/nearest/search-by-postcode`
    );
  });

  test('redirects to search-results page if only one area, action is documents and national results are available', async () => {
    mockGetAllServices.mockResolvedValue([mockService]);
    mockGetServiceAreas.mockResolvedValue([mockServiceArea]);
    req.params = { action: 'documents', service: 'test-service' };
    await controller.render(req as FactRequest, res);
    expect(res.redirect).toHaveBeenCalledWith(`/services/${req.params.service}/${mockServiceArea.slug}/search-results`);
  });

  test('redirects to postcode page if only one area, action is documents and only local results are available', async () => {
    mockGetAllServices.mockResolvedValue([mockService]);
    mockGetServiceAreas.mockResolvedValue([mockServiceArea3]);
    req.params = { action: 'documents', service: 'test-service' };
    await controller.render(req as FactRequest, res);
    expect(res.redirect).toHaveBeenCalledWith(
      `/services/${req.params.service}/${mockServiceArea3.slug}/${req.params.action}/search-by-postcode`
    );
  });

  test('redirects to postcode page when area selected, action is nearest and local results are available', async () => {
    mockGetAllServices.mockResolvedValue([mockService]);
    mockGetServiceAreas.mockResolvedValue([mockServiceArea, mockServiceArea2]);
    req.params = { action: 'nearest', service: 'test-service' };
    req.body = { area: mockServiceArea2.slug };
    await controller.continue(req as FactRequest, res);
    expect(res.redirect).toHaveBeenCalledWith(
      `/services/${req.params.service}/${mockServiceArea2.slug}/${req.params.action}/search-by-postcode`
    );
  });

  test('redirects to search-resuts page when area selected, action is nearest and local results are NOT available', async () => {
    mockGetAllServices.mockResolvedValue([mockService]);
    mockGetServiceAreas.mockResolvedValue([mockServiceArea, mockServiceArea3]);
    req.params = { action: 'documents', service: 'test-service' };
    req.body = { area: mockServiceArea.slug };
    await controller.continue(req as FactRequest, res);
    expect(res.redirect).toHaveBeenCalledWith(`/services/${req.params.service}/${mockServiceArea.slug}/search-results`);
  });

  test('redirects to search-results page when area selected, action is documents and national results are available', async () => {
    mockGetAllServices.mockResolvedValue([mockService]);
    mockGetServiceAreas.mockResolvedValue([mockServiceArea, mockServiceArea2]);
    req.params = { action: 'documents', service: 'test-service' };
    req.body = { area: mockServiceArea.slug };
    await controller.continue(req as FactRequest, res);
    expect(res.redirect).toHaveBeenCalledWith(`/services/${req.params.service}/${mockServiceArea.slug}/search-results`);
  });

  test('redirects to postcode page when area selected, action is documents and national results are NOT available', async () => {
    mockGetAllServices.mockResolvedValue([mockService]);
    mockGetServiceAreas.mockResolvedValue([mockServiceArea, mockServiceArea3]);
    req.params = { action: 'documents', service: 'test-service' };
    req.body = { area: mockServiceArea3.slug };
    await controller.continue(req as FactRequest, res);
    expect(res.redirect).toHaveBeenCalledWith(
      `/services/${req.params.service}/${mockServiceArea3.slug}/${req.params.action}/search-by-postcode`
    );
  });

  test('renders not-found if action is invalid', async () => {
    req.params = { action: 'invalid', service: 'test-service' };
    await controller.render(req as FactRequest, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.render).toHaveBeenCalledWith('not-found', expect.objectContaining({ title: 'Not Found' }));
  });

  test('renders not-found if action is invalid (POST)', async () => {
    req.params = { action: 'invalid', service: 'test-service' };
    await controller.continue(req as FactRequest, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.render).toHaveBeenCalledWith('not-found', expect.objectContaining({ title: 'Not Found' }));
  });

  test('redirects back to service selection if area is not-listed', async () => {
    req.body = { area: 'not-listed' };
    req.params = { action: 'nearest', service: 'test-service' };
    await controller.continue(req as FactRequest, res);
    expect(res.redirect).toHaveBeenCalledWith(`/services/${req.params.action}`);
  });

  test('renders not-found if service area is not found', async () => {
    req.body = { area: 'area-unknown' };
    mockGetAllServices.mockResolvedValue([mockService]);
    mockGetServiceAreas.mockResolvedValue([mockServiceArea]);
    await controller.continue(req as FactRequest, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.render).toHaveBeenCalledWith('not-found', expect.objectContaining({ title: 'Not Found' }));
  });

  test('renders choose-service-area page with errors when area is missing', async () => {
    mockGetAllServices.mockResolvedValue([mockService]);
    mockGetServiceAreas.mockResolvedValue([mockServiceArea, mockServiceArea2, mockServiceArea3]);
    req.body = {};
    await controller.continue(req as FactRequest, res);
    expect(res.render).toHaveBeenCalledWith('choose-service-area', expect.objectContaining({ errors: true }));
  });

  test('renders not-found if service is not found', async () => {
    mockGetAllServices.mockResolvedValue([]);
    await controller.render(req as FactRequest, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.render).toHaveBeenCalledWith('not-found', expect.objectContaining({ title: 'Not Found' }));
  });
});
