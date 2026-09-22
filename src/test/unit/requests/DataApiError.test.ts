import { HttpStatusCode } from 'axios';

import {
  DATA_API_ERROR_CODES,
  isDataApiError,
  mapDataApiError,
  toDataApiErrorEnvelope,
} from '../../../main/requests/DataApiError';

describe('DataApiError', () => {
  test.each([HttpStatusCode.Unauthorized, HttpStatusCode.Forbidden, HttpStatusCode.InternalServerError])(
    'maps upstream response status %s to a controlled bad gateway error',
    status => {
      expect(mapDataApiError({ isAxiosError: true, response: { status } })).toEqual({
        code: DATA_API_ERROR_CODES.BAD_RESPONSE,
        message: 'The Data API returned an invalid response',
        status: HttpStatusCode.BadGateway,
      });
    }
  );

  test.each([HttpStatusCode.ServiceUnavailable, HttpStatusCode.GatewayTimeout])(
    'maps upstream availability status %s to service unavailable',
    status => {
      expect(mapDataApiError({ isAxiosError: true, response: { status } })).toMatchObject({
        code: DATA_API_ERROR_CODES.UNAVAILABLE,
        status: HttpStatusCode.ServiceUnavailable,
      });
    }
  );

  test('maps a transport failure to service unavailable', () => {
    expect(mapDataApiError({ isAxiosError: true })).toMatchObject({
      code: DATA_API_ERROR_CODES.UNAVAILABLE,
      status: HttpStatusCode.ServiceUnavailable,
    });
  });

  test('only preserves bad request and not found when the endpoint contract allows them', () => {
    const badRequest = { isAxiosError: true, response: { status: HttpStatusCode.BadRequest } };
    const notFound = { isAxiosError: true, response: { status: HttpStatusCode.NotFound } };

    expect(mapDataApiError(badRequest)).toMatchObject({ status: HttpStatusCode.BadGateway });
    expect(mapDataApiError(badRequest, { badRequest: true })).toMatchObject({
      code: DATA_API_ERROR_CODES.INVALID_REQUEST,
      status: HttpStatusCode.BadRequest,
    });
    expect(mapDataApiError(notFound)).toMatchObject({ status: HttpStatusCode.BadGateway });
    expect(mapDataApiError(notFound, { notFound: true })).toMatchObject({
      code: DATA_API_ERROR_CODES.NOT_FOUND,
      status: HttpStatusCode.NotFound,
    });
  });

  test('maps parse failures to bad gateway', () => {
    expect(mapDataApiError(new SyntaxError('invalid JSON'))).toMatchObject({
      code: DATA_API_ERROR_CODES.BAD_RESPONSE,
      status: HttpStatusCode.BadGateway,
    });
  });

  test('provides a stable public JSON envelope without the status field', () => {
    const error = mapDataApiError({ isAxiosError: true });

    expect(isDataApiError(error)).toBe(true);
    expect(toDataApiErrorEnvelope(error)).toEqual({
      error: {
        code: DATA_API_ERROR_CODES.UNAVAILABLE,
        message: 'The Data API is temporarily unavailable',
      },
    });
  });

  test('rejects objects whose error code and status are inconsistent', () => {
    expect(
      isDataApiError({
        code: DATA_API_ERROR_CODES.NOT_FOUND,
        message: 'The requested resource was not found',
        status: HttpStatusCode.BadGateway,
      })
    ).toBe(false);
  });
});
