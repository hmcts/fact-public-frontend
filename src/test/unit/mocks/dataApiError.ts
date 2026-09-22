import { HttpStatusCode } from 'axios';

import { DATA_API_ERROR_CODES, DataApiError } from '../../../main/requests/DataApiError';

export const badRequestDataApiError: DataApiError = {
  code: DATA_API_ERROR_CODES.INVALID_REQUEST,
  message: 'The request is invalid',
  status: HttpStatusCode.BadRequest,
};

export const badResponseDataApiError: DataApiError = {
  code: DATA_API_ERROR_CODES.BAD_RESPONSE,
  message: 'The Data API returned an invalid response',
  status: HttpStatusCode.BadGateway,
};

export const notFoundDataApiError: DataApiError = {
  code: DATA_API_ERROR_CODES.NOT_FOUND,
  message: 'The requested resource was not found',
  status: HttpStatusCode.NotFound,
};

export const unavailableDataApiError: DataApiError = {
  code: DATA_API_ERROR_CODES.UNAVAILABLE,
  message: 'The Data API is temporarily unavailable',
  status: HttpStatusCode.ServiceUnavailable,
};
