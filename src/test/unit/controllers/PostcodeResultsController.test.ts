import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { HttpStatusCode } from 'axios';
import { Response } from 'express';

import PostcodeResultsController from '../../../main/controllers/PostcodeResultsController';
import { FactRequest } from '../../../main/interfaces/FactRequest';
import { DataApiError } from '../../../main/requests/DataApiError';
import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import { ServiceArea } from '../../../main/schemas/ServiceAreaSchema';
import { CourtWithDistance } from '../../../main/schemas/courtWithDistance';
import { SEARCH_RESULT_TYPES, SearchResult } from '../../../main/schemas/searchResult';
import { calculateServiceAreaFromSlug, calculateServiceNameFromSlug } from '../../../main/utils/SchemaUtils';
import {
  badRequestDataApiError,
  badResponseDataApiError,
  notFoundDataApiError,
  unavailableDataApiError,
} from '../mocks/dataApiError';

jest.mock('../../../main/utils/SchemaUtils', () => ({
  calculateServiceAreaFromSlug: jest.fn(),
  calculateServiceNameFromSlug: jest.fn(),
}));

const mockPerformPostcodeSearch: jest.MockedFunction<
  (postcode: string, serviceArea: string, action: string) => Promise<SearchResult[] | DataApiError>
> = jest.fn();
const mockPerformPostcodeOnlySearch: jest.MockedFunction<
  (postcode: string) => Promise<CourtWithDistance[] | DataApiError>
> = jest.fn();

const dataApiRequests = {
  performPostcodeSearch: mockPerformPostcodeSearch,
  performPostcodeOnlySearch: mockPerformPostcodeOnlySearch,
} as unknown as DataApiRequests;

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
          error: { title: 'Error' },
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
    controller = new PostcodeResultsController(dataApiRequests);
    jest.clearAllMocks();
  });

  test('GET: redirects to search page with error if postcode is invalid (no service)', async () => {
    req.query = { postcode: 'bad' };
    req.params = {};
    await controller.get(req as FactRequest, res);
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('/search-by-postcode?error='));
  });

  test('GET: redirects to search page with missing space error if postcode does not contain a space', async () => {
    req.query = { postcode: 'SW1A1AA' };
    req.params = {};
    await controller.get(req as FactRequest, res);
    expect(res.redirect).toHaveBeenCalledWith('/search-by-postcode?error=missingPostcodeSpace');
    expect(mockPerformPostcodeOnlySearch).not.toHaveBeenCalled();
  });

  test('GET: redirects to service search page with error if postcode is invalid (with service)', async () => {
    req.query = { postcode: 'bad' };
    await controller.get(req as FactRequest, res);
    expect(res.redirect).toHaveBeenCalledWith(
      expect.stringContaining('/services/service/area/nearest/search-by-postcode?error=')
    );
  });

  test('GET: renders not-found when service error redirect throws', async () => {
    req.query = { postcode: 'bad' };
    (res.redirect as jest.Mock).mockImplementation(() => {
      throw new Error('redirect failed');
    });

    await controller.get(req as FactRequest, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.render).toHaveBeenCalledWith('not-found', expect.objectContaining({ title: 'Not Found' }));
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

  test('GET: treats a postcode rejected by the Data API as no results', async () => {
    req.query = { postcode: 'PL22 2XX' };
    req.params = {};
    mockPerformPostcodeOnlySearch.mockResolvedValue(badRequestDataApiError);

    await controller.get(req as FactRequest, res);

    expect(res.redirect).toHaveBeenCalledWith('/search-by-postcode?noResults=true');
    expect(res.render).not.toHaveBeenCalled();
  });

  test('GET: renders service unavailable when postcode-only search cannot reach the Data API', async () => {
    req.query = { postcode: 'SW1A 1AA' };
    req.params = {};
    mockPerformPostcodeOnlySearch.mockResolvedValue(unavailableDataApiError);

    await controller.get(req as FactRequest, res);

    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.ServiceUnavailable);
    expect(res.render).toHaveBeenCalledWith('error', expect.objectContaining({ title: 'Error' }));
    expect(res.redirect).not.toHaveBeenCalled();
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
        id: '1',
        name: 'Court',
        slug: 'court-slug',
        distance: 1.2,
        type: SEARCH_RESULT_TYPES.COURT,
      },
    ]);
    await controller.get(req as FactRequest, res);
    expect(res.render).toHaveBeenCalledWith(
      'postcode-results',
      expect.objectContaining({
        postcodeOnlySearch: false,
        results: {
          locations: [
            {
              id: '1',
              name: 'Court',
              slug: 'court-slug',
              distance: 1.2,
              type: SEARCH_RESULT_TYPES.COURT,
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

  test('GET: treats a service-area postcode rejected by the Data API as no results', async () => {
    req.query = { postcode: 'PL22 2XX' };
    calculateServiceNameFromSlugMock.mockResolvedValue('service');
    calculateServiceAreaFromSlugMock.mockResolvedValue({
      name: 'Area',
      nameCy: 'Ardal',
      slug: 'area',
    } as ServiceArea);
    mockPerformPostcodeSearch.mockResolvedValue(badRequestDataApiError);

    await controller.get(req as FactRequest, res);

    expect(res.redirect).toHaveBeenCalledWith('/services/service/area/nearest/search-by-postcode?noResults=true');
    expect(res.render).not.toHaveBeenCalled();
  });

  test('GET: rejects an invalid service action before calling dependencies', async () => {
    req.query = { postcode: 'SW1A 1AA' };
    req.params = { service: 'service', serviceArea: 'area', action: 'invalid' };

    await controller.get(req as FactRequest, res);

    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(calculateServiceNameFromSlugMock).not.toHaveBeenCalled();
    expect(mockPerformPostcodeSearch).not.toHaveBeenCalled();
  });

  test.each([
    [notFoundDataApiError, HttpStatusCode.NotFound, 'not-found'],
    [badResponseDataApiError, HttpStatusCode.BadGateway, 'error'],
  ] as const)('GET: renders mapped status %s for a service-area search error', async (apiError, status, view) => {
    req.query = { postcode: 'SW1A 1AA' };
    calculateServiceNameFromSlugMock.mockResolvedValue('service');
    calculateServiceAreaFromSlugMock.mockResolvedValue({
      name: 'Area',
      nameCy: 'Ardal',
      slug: 'area',
    } as ServiceArea);
    mockPerformPostcodeSearch.mockResolvedValue(apiError);

    await controller.get(req as FactRequest, res);

    expect(res.status).toHaveBeenCalledWith(status);
    expect(res.render).toHaveBeenCalledWith(view, expect.anything());
    expect(res.redirect).not.toHaveBeenCalled();
  });

  test('GET: preserves a structured Data API error raised while resolving slugs', async () => {
    req.query = { postcode: 'SW1A 1AA' };
    calculateServiceNameFromSlugMock.mockRejectedValue(badResponseDataApiError);

    await controller.get(req as FactRequest, res);

    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.BadGateway);
    expect(res.render).toHaveBeenCalledWith('error', expect.objectContaining({ title: 'Error' }));
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
        id: '1',
        name: 'Court',
        slug: 'court-slug',
        distance: 1.2,
        type: SEARCH_RESULT_TYPES.COURT,
      },
    ]);
    await controller.get(req as FactRequest, res);
    expect(res.render).toHaveBeenCalledWith(
      'postcode-results',
      expect.objectContaining({
        postcodeOnlySearch: false,
        results: {
          locations: [
            {
              id: '1',
              name: 'Court',
              slug: 'court-slug',
              distance: 1.2,
              type: SEARCH_RESULT_TYPES.COURT,
            },
          ],
        },
        serviceArea: 'ardal',
      })
    );
  });

  test('GET: redirects to childcare-specific Scottish error for childcare service area', async () => {
    req.query = { postcode: 'G2 8GT' };
    req.params = {
      service: 'service',
      serviceArea: 'childcare-arrangements-if-you-separate-from-your-partner',
      action: 'nearest',
    };

    await controller.get(req as FactRequest, res);

    expect(res.redirect).toHaveBeenCalledWith(
      '/services/service/childcare-arrangements-if-you-separate-from-your-partner/nearest/search-by-postcode?error=scottishChildrenPostcode'
    );
    expect(mockPerformPostcodeSearch).not.toHaveBeenCalled();
  });

  test('GET: accepts Scottish postcode for benefits service area and performs search', async () => {
    req.query = { postcode: 'PH2 0RJ' };
    req.params = { service: 'service', serviceArea: 'benefits', action: 'nearest' };
    calculateServiceNameFromSlugMock.mockResolvedValue('service');
    calculateServiceAreaFromSlugMock.mockResolvedValue({
      name: 'Benefits',
      nameCy: 'Budd-daliadau',
      slug: 'benefits',
      onlineText: null,
      onlineUrl: null,
    } as ServiceArea);
    mockPerformPostcodeSearch.mockResolvedValue([]);

    await controller.get(req as FactRequest, res);

    expect(mockPerformPostcodeSearch).toHaveBeenCalledWith('PH2 0RJ', 'Benefits', 'nearest');
    expect(res.redirect).toHaveBeenCalledWith('/services/service/benefits/nearest/search-by-postcode?noResults=true');
  });
});
