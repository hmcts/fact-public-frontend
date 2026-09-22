import { HttpStatusCode, isAxiosError } from 'axios';

export const DATA_API_ERROR_CODES = {
  BAD_RESPONSE: 'DATA_API_BAD_RESPONSE',
  INVALID_REQUEST: 'INVALID_REQUEST',
  NOT_FOUND: 'NOT_FOUND',
  UNAVAILABLE: 'DATA_API_UNAVAILABLE',
} as const;

export type DataApiErrorCode = (typeof DATA_API_ERROR_CODES)[keyof typeof DATA_API_ERROR_CODES];

export type DataApiError =
  | {
      readonly code: typeof DATA_API_ERROR_CODES.BAD_RESPONSE;
      readonly message: 'The Data API returned an invalid response';
      readonly status: HttpStatusCode.BadGateway;
    }
  | {
      readonly code: typeof DATA_API_ERROR_CODES.INVALID_REQUEST;
      readonly message: 'The request is invalid';
      readonly status: HttpStatusCode.BadRequest;
    }
  | {
      readonly code: typeof DATA_API_ERROR_CODES.NOT_FOUND;
      readonly message: 'The requested resource was not found';
      readonly status: HttpStatusCode.NotFound;
    }
  | {
      readonly code: typeof DATA_API_ERROR_CODES.UNAVAILABLE;
      readonly message: 'The Data API is temporarily unavailable';
      readonly status: HttpStatusCode.ServiceUnavailable;
    };

export type DataApiErrorMapping = {
  readonly badRequest?: boolean;
  readonly notFound?: boolean;
};

const ERRORS: Record<DataApiErrorCode, DataApiError> = {
  [DATA_API_ERROR_CODES.BAD_RESPONSE]: {
    code: DATA_API_ERROR_CODES.BAD_RESPONSE,
    message: 'The Data API returned an invalid response',
    status: HttpStatusCode.BadGateway,
  },
  [DATA_API_ERROR_CODES.INVALID_REQUEST]: {
    code: DATA_API_ERROR_CODES.INVALID_REQUEST,
    message: 'The request is invalid',
    status: HttpStatusCode.BadRequest,
  },
  [DATA_API_ERROR_CODES.NOT_FOUND]: {
    code: DATA_API_ERROR_CODES.NOT_FOUND,
    message: 'The requested resource was not found',
    status: HttpStatusCode.NotFound,
  },
  [DATA_API_ERROR_CODES.UNAVAILABLE]: {
    code: DATA_API_ERROR_CODES.UNAVAILABLE,
    message: 'The Data API is temporarily unavailable',
    status: HttpStatusCode.ServiceUnavailable,
  },
};

export function mapDataApiError(error: unknown, mapping: DataApiErrorMapping = {}): DataApiError {
  if (!isAxiosError(error)) {
    return ERRORS[DATA_API_ERROR_CODES.BAD_RESPONSE];
  }

  const upstreamStatus = error.response?.status;
  if (upstreamStatus === undefined) {
    return ERRORS[DATA_API_ERROR_CODES.UNAVAILABLE];
  }

  if (upstreamStatus === HttpStatusCode.BadRequest && mapping.badRequest) {
    return ERRORS[DATA_API_ERROR_CODES.INVALID_REQUEST];
  }

  if (upstreamStatus === HttpStatusCode.NotFound && mapping.notFound) {
    return ERRORS[DATA_API_ERROR_CODES.NOT_FOUND];
  }

  if (upstreamStatus === HttpStatusCode.ServiceUnavailable || upstreamStatus === HttpStatusCode.GatewayTimeout) {
    return ERRORS[DATA_API_ERROR_CODES.UNAVAILABLE];
  }

  return ERRORS[DATA_API_ERROR_CODES.BAD_RESPONSE];
}

export function isDataApiError(value: unknown): value is DataApiError {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return Object.values(ERRORS).some(
    error => candidate.code === error.code && candidate.message === error.message && candidate.status === error.status
  );
}

export function toDataApiErrorEnvelope(error: DataApiError): { error: { code: DataApiErrorCode; message: string } } {
  return {
    error: {
      code: error.code,
      message: error.message,
    },
  };
}
