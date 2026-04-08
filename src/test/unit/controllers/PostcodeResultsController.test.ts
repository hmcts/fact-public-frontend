import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { HttpStatusCode } from 'axios';
import { Response } from 'express';

import PostcodeResultsController from '../../../main/controllers/PostcodeResultsController';
import { FactRequest } from '../../../main/interfaces/FactRequest';
import { ServiceArea } from '../../../main/schemas/ServiceAreaSchema';
import { CourtWithDistance } from '../../../main/schemas/courtWithDistance';
import { calculateServiceAreaFromSlug, calculateServiceNameFromSlug } from '../../../main/utils/SchemaUtils';

jest.mock('../../../main/utils/SchemaUtils', () => ({
  calculateServiceAreaFromSlug: jest.fn(),
  calculateServiceNameFromSlug: jest.fn(),
}));

const mockPerformPostcodeSearch: jest.MockedFunction<
  (postcode: string, serviceArea: string, action: string) => Promise<CourtWithDistance[] | HttpStatusCode>
> = jest.fn();
const mockPerformPostcodeOnlySearch: jest.MockedFunction<
  (postcode: string) => Promise<CourtWithDistance[] | HttpStatusCode>
> = jest.fn();

jest.mock('../../../main/requests/DataApiRequests', () => {
  return {
    DataApiRequests: jest.fn().mockImplementation(() => ({
      performPostcodeSearch: (postcode: string, serviceArea: string, action: string) =>
        mockPerformPostcodeSearch(postcode, serviceArea, action),
      performPostcodeOnlySearch: (postcode: string) => mockPerformPostcodeOnlySearch(postcode),
    })),
  };
});

const calculateServiceNameFromSlugMock = calculateServiceNameFromSlug as jest.MockedFunction<
  typeof calculateServiceNameFromSlug
>;
const calculateServiceAreaFromSlugMock = calculateServiceAreaFromSlug as jest.MockedFunction<
  typeof calculateServiceAreaFromSlug
>;

describe('PostcodeResultsController', () => {
  let req: Partial<FactRequest>;
  let res: Response;
  let controller: PostcodeResultsController;

  beforeEach(() => {
    req = {
      i18n: {
        getDataByLanguage: jest.fn().mockReturnValue({
          'postcode-results': { title: 'Postcode Results' },
          'not-found': { title: 'Not Found' },
        }),
      } as unknown as FactRequest['i18n'],
      lng: 'en',
      params: { service: 'service', serviceArea: 'area', action: 'nearest' },
      query: {},
      body: {},
    };
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;
    mockPerformPostcodeSearch.mockReset();
    mockPerformPostcodeOnlySearch.mockReset();
    controller = new PostcodeResultsController();
    jest.clearAllMocks();
  });

  test('GET: redirects to search page with error if postcode is invalid (no service)', async () => {
    req.query = { postcode: 'bad' };
    req.params = {};
    await controller.get(req as FactRequest, res);
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('/search-by-postcode?error='));
  });

  test('GET: redirects to service search page with error if postcode is invalid (with service)', async () => {
    req.query = { postcode: 'bad' };
    await controller.get(req as FactRequest, res);
    expect(res.redirect).toHaveBeenCalledWith(
      expect.stringContaining('/services/service/area/nearest/search-by-postcode?error=')
    );
  });

  test('GET: performs postcode only search and renders results', async () => {
    req.query = { postcode: 'SW1A 1AA' };
    req.params = {};
    mockPerformPostcodeOnlySearch.mockResolvedValue([
      {
        courtName: 'Court',
        courtSlug: 'court-slug',
        courtId: '1',
        distance: 1.2,
      },
    ]);
    await controller.get(req as FactRequest, res);
    expect(res.render).toHaveBeenCalledWith(
      'postcode-results',
      expect.objectContaining({
        postcodeOnlySearch: true,
        results: {
          courts: [
            {
              courtName: 'Court',
              courtSlug: 'court-slug',
              courtId: '1',
              distance: 1.2,
            },
          ],
        },
      })
    );
  });

  test('GET: performs postcode only search and redirects if no results', async () => {
    req.query = { postcode: 'SW1A 1AA' };
    req.params = {};
    mockPerformPostcodeOnlySearch.mockResolvedValue([]);
    await controller.get(req as FactRequest, res);
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('/search-by-postcode?noResults=true'));
  });

  test('GET: performs service area postcode search and renders results', async () => {
    req.query = { postcode: 'SW1A 1AA' };
    calculateServiceNameFromSlugMock.mockResolvedValue('service');
    calculateServiceAreaFromSlugMock.mockResolvedValue({
      name: 'Area',
      nameCy: 'Ardal',
      onlineText: 'Online',
      onlineUrl: 'url',
    } as ServiceArea);
    mockPerformPostcodeSearch.mockResolvedValue([
      {
        courtName: 'Court',
        courtSlug: 'court-slug',
        courtId: '1',
        distance: 1.2,
      },
    ]);
    await controller.get(req as FactRequest, res);
    expect(res.render).toHaveBeenCalledWith(
      'postcode-results',
      expect.objectContaining({
        postcodeOnlySearch: false,
        results: {
          courts: [
            {
              courtName: 'Court',
              courtSlug: 'court-slug',
              courtId: '1',
              distance: 1.2,
            },
          ],
        },
        serviceArea: 'area',
      })
    );
  });

  test('GET: performs service area postcode search and redirects if no results', async () => {
    req.query = { postcode: 'SW1A 1AA' };
    calculateServiceNameFromSlugMock.mockResolvedValue('service');
    calculateServiceAreaFromSlugMock.mockResolvedValue({
      name: 'Area',
      nameCy: 'Ardal',
      onlineText: 'Online',
      onlineUrl: 'url',
      slug: 'area',
    } as ServiceArea);
    mockPerformPostcodeSearch.mockResolvedValue([]);
    await controller.get(req as FactRequest, res);
    expect(res.redirect).toHaveBeenCalledWith(
      expect.stringContaining('/services/service/area/nearest/search-by-postcode?noResults=true')
    );
  });

  test('GET: renders not-found if error thrown in service area postcode search', async () => {
    req.query = { postcode: 'SW1A 1AA' };
    calculateServiceNameFromSlugMock.mockRejectedValue(new Error('fail'));
    await controller.get(req as FactRequest, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.render).toHaveBeenCalledWith('not-found', expect.objectContaining({ title: 'Not Found' }));
  });

  test('GET: performs service area postcode search and renders results in Welsh (cy)', async () => {
    req.query = { postcode: 'SW1A 1AA' };
    req.lng = 'cy';
    calculateServiceNameFromSlugMock.mockResolvedValue('service');
    calculateServiceAreaFromSlugMock.mockResolvedValue({
      name: 'Area',
      nameCy: 'Ardal',
      onlineText: 'Online',
      onlineUrl: 'url',
    } as ServiceArea);
    mockPerformPostcodeSearch.mockResolvedValue([
      {
        courtName: 'Court',
        courtSlug: 'court-slug',
        courtId: '1',
        distance: 1.2,
      },
    ]);
    await controller.get(req as FactRequest, res);
    expect(res.render).toHaveBeenCalledWith(
      'postcode-results',
      expect.objectContaining({
        postcodeOnlySearch: false,
        results: {
          courts: [
            {
              courtName: 'Court',
              courtSlug: 'court-slug',
              courtId: '1',
              distance: 1.2,
            },
          ],
        },
        serviceArea: 'ardal',
      })
    );
  });
});
