import { Response } from 'express';

import {
  postcodeResultsRedirect,
  postcodeSearchRedirect,
  servicePostcodeResultsRedirect,
  servicePostcodeSearchRedirect,
} from '../../../main/utils/RedirectUtils';

describe('RedirectUtils', () => {
  test('servicePostcodeSearchRedirect appends error query when error is provided', () => {
    const res = { redirect: jest.fn() } as unknown as Response;

    servicePostcodeSearchRedirect(res, 'service', 'area', 'nearest', 'invalidPostcode');

    expect(res.redirect).toHaveBeenCalledWith(
      '/services/service/area/nearest/search-by-postcode?error=invalidPostcode'
    );
  });

  test('servicePostcodeSearchRedirect appends noResults query when there is no error', () => {
    const res = { redirect: jest.fn() } as unknown as Response;

    servicePostcodeSearchRedirect(res, 'service', 'area', 'nearest', null, true);

    expect(res.redirect).toHaveBeenCalledWith('/services/service/area/nearest/search-by-postcode?noResults=true');
  });

  test('servicePostcodeSearchRedirect uses the base path when there is no error or noResults', () => {
    const res = { redirect: jest.fn() } as unknown as Response;

    servicePostcodeSearchRedirect(res, 'service', 'area', 'nearest');

    expect(res.redirect).toHaveBeenCalledWith('/services/service/area/nearest/search-by-postcode');
  });

  test('postcodeSearchRedirect appends error query when error is provided', () => {
    const res = { redirect: jest.fn() } as unknown as Response;

    postcodeSearchRedirect(res, 'invalidPostcode');

    expect(res.redirect).toHaveBeenCalledWith('/search-by-postcode?error=invalidPostcode');
  });

  test('postcodeSearchRedirect appends noResults query when requested', () => {
    const res = { redirect: jest.fn() } as unknown as Response;

    postcodeSearchRedirect(res, null, true);

    expect(res.redirect).toHaveBeenCalledWith('/search-by-postcode?noResults=true');
  });

  test('postcodeSearchRedirect uses the base path when there is no error or noResults', () => {
    const res = { redirect: jest.fn() } as unknown as Response;

    postcodeSearchRedirect(res);

    expect(res.redirect).toHaveBeenCalledWith('/search-by-postcode');
  });

  test('servicePostcodeResultsRedirect includes route params and postcode', () => {
    const res = { redirect: jest.fn() } as unknown as Response;

    servicePostcodeResultsRedirect(res, 'service', 'area', 'nearest', 'SW1A 1AA');

    expect(res.redirect).toHaveBeenCalledWith(
      '/services/service/area/nearest/search-by-postcode/courts/near?postcode=SW1A 1AA'
    );
  });

  test('postcodeResultsRedirect includes postcode query', () => {
    const res = { redirect: jest.fn() } as unknown as Response;

    postcodeResultsRedirect(res, 'SW1A 1AA');

    expect(res.redirect).toHaveBeenCalledWith('/search-by-postcode/courts/near?postcode=SW1A 1AA');
  });
});
