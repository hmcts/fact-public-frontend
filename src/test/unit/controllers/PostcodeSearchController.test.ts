import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { Response } from 'express';

import PostcodeSearchController from '../../../main/controllers/PostcodeSearchController';
import { FactRequest } from '../../../main/interfaces/FactRequest';
import { ServiceArea } from '../../../main/schemas/ServiceAreaSchema';
import { calculateServiceAreaFromSlug, calculateServiceNameFromSlug } from '../../../main/utils/SchemaUtils';

jest.mock('../../../main/utils/SchemaUtils', () => ({
  calculateServiceAreaFromSlug: jest.fn(),
  calculateServiceNameFromSlug: jest.fn(),
}));

const calculateServiceNameFromSlugMock = calculateServiceNameFromSlug as jest.MockedFunction<
  typeof calculateServiceNameFromSlug
>;
const calculateServiceAreaFromSlugMock = calculateServiceAreaFromSlug as jest.MockedFunction<
  typeof calculateServiceAreaFromSlug
>;

describe('PostcodeSearchController', () => {
  let req: Partial<FactRequest>;
  let res: Response;
  let controller: PostcodeSearchController;

  beforeEach(() => {
    req = {
      i18n: {
        getDataByLanguage: jest.fn().mockReturnValue({
          'postcode-search': { title: 'Postcode Search' },
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
    controller = new PostcodeSearchController();
    jest.clearAllMocks();
  });

  test('GET: renders postcode-search page with no errors', async () => {
    calculateServiceNameFromSlugMock.mockResolvedValue('service');
    calculateServiceAreaFromSlugMock.mockResolvedValue({ name: 'Area', nameCy: 'Ardal' } as ServiceArea);
    await controller.render(req as FactRequest, res);
    expect(res.render).toHaveBeenCalledWith('postcode-search', expect.objectContaining({ title: 'Postcode Search' }));
  });

  test('GET: renders postcode-search page with error and noResults', async () => {
    calculateServiceNameFromSlugMock.mockResolvedValue('service');
    calculateServiceAreaFromSlugMock.mockResolvedValue({ name: 'Area', nameCy: 'Ardal' } as ServiceArea);
    req.query = { error: 'invalidPostcode', noResults: 'true' };
    await controller.render(req as FactRequest, res);
    expect(res.render).toHaveBeenCalledWith(
      'postcode-search',
      expect.objectContaining({ errorType: 'invalidPostcode', hasNoResults: true })
    );
  });

  test('POST: renders error if postcode is invalid', async () => {
    calculateServiceNameFromSlugMock.mockResolvedValue('service');
    calculateServiceAreaFromSlugMock.mockResolvedValue({ name: 'Area', nameCy: 'Ardal' } as ServiceArea);
    req.body = { postcode: 'bad' };
    await controller.continue(req as FactRequest, res);
    expect(res.render).toHaveBeenCalledWith(
      'postcode-search',
      expect.objectContaining({ errorType: 'invalidPostcode', error: true })
    );
  });

  test('POST: renders missing space error if postcode does not contain a space', async () => {
    calculateServiceNameFromSlugMock.mockResolvedValue('service');
    calculateServiceAreaFromSlugMock.mockResolvedValue({ name: 'Area', nameCy: 'Ardal' } as ServiceArea);
    req.body = { postcode: 'SW1A1AA' };
    await controller.continue(req as FactRequest, res);
    expect(res.render).toHaveBeenCalledWith(
      'postcode-search',
      expect.objectContaining({ errorType: 'missingPostcodeSpace', error: true })
    );
  });

  test('POST: redirects to /search-by-postcode/courts/near if no service search', async () => {
    req.body = { postcode: 'SW1A 1AA' };
    req.params = {};
    await controller.continue(req as FactRequest, res);
    expect(res.redirect).toHaveBeenCalledWith('/search-by-postcode/courts/near?postcode=SW1A 1AA');
  });

  test('POST: redirects to service-specific postcode search', async () => {
    req.body = { postcode: 'SW1A 1AA' };
    req.params = { service: 'service', serviceArea: 'area', action: 'nearest' };
    await controller.continue(req as FactRequest, res);
    expect(res.redirect).toHaveBeenCalledWith(
      '/services/service/area/nearest/search-by-postcode/courts/near?postcode=SW1A 1AA'
    );
  });

  test('POST: renders not-found if error thrown in redirect', async () => {
    req.body = { postcode: 'SW1A 1AA' };
    req.params = { service: 'service', serviceArea: 'area', action: 'nearest' };
    (res.redirect as jest.Mock).mockImplementation(() => {
      throw new Error('fail');
    });
    await controller.continue(req as FactRequest, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.render).toHaveBeenCalledWith('not-found', expect.objectContaining({ title: 'Not Found' }));
  });

  test('GET: renders postcode-search page with serviceAreaLocalised in Welsh', async () => {
    calculateServiceNameFromSlugMock.mockResolvedValue('service');
    calculateServiceAreaFromSlugMock.mockResolvedValue({ name: 'Area', nameCy: 'Ardal' } as ServiceArea);
    req.lng = 'cy';
    await controller.render(req as FactRequest, res);
    expect(res.render).toHaveBeenCalledWith(
      'postcode-search',
      expect.objectContaining({ serviceAreaLocalised: 'Ardal' })
    );
  });

  test('POST: renders postcode-search page with serviceAreaLocalised in Welsh on invalid postcode', async () => {
    calculateServiceNameFromSlugMock.mockResolvedValue('service');
    calculateServiceAreaFromSlugMock.mockResolvedValue({ name: 'Area', nameCy: 'Ardal' } as ServiceArea);
    req.lng = 'cy';
    req.body = { postcode: 'bad' };
    await controller.continue(req as FactRequest, res);
    expect(res.render).toHaveBeenCalledWith(
      'postcode-search',
      expect.objectContaining({ serviceAreaLocalised: 'Ardal', errorType: 'invalidPostcode', error: true })
    );
  });

  test('POST: renders childcare-specific Scottish error for childcare service area', async () => {
    calculateServiceNameFromSlugMock.mockResolvedValue('service');
    calculateServiceAreaFromSlugMock.mockResolvedValue({ name: 'Area', nameCy: 'Ardal' } as ServiceArea);
    req.params = {
      service: 'service',
      serviceArea: 'childcare-arrangements-if-you-separate-from-your-partner',
      action: 'nearest',
    };
    req.body = { postcode: 'G2 8GT' };

    await controller.continue(req as FactRequest, res);

    expect(res.render).toHaveBeenCalledWith(
      'postcode-search',
      expect.objectContaining({ errorType: 'scottishChildrenPostcode', error: true })
    );
  });

  test('POST: allows Scottish postcode for benefits service area and redirects to results', async () => {
    req.params = { service: 'service', serviceArea: 'benefits', action: 'nearest' };
    req.body = { postcode: 'PH2 0RJ' };

    await controller.continue(req as FactRequest, res);

    expect(res.redirect).toHaveBeenCalledWith(
      '/services/service/benefits/nearest/search-by-postcode/courts/near?postcode=PH2 0RJ'
    );
  });
});
