import { stub } from 'sinon';

import { FactRequest } from '../../../main/interfaces/FactRequest';

export const mockRequest = (data: unknown): FactRequest => {
  const req: Partial<FactRequest> = {
    body: {},
    i18n: {
      getDataByLanguage: stub().returns(data),
    } as unknown as FactRequest['i18n'],
    lng: 'en',
    params: {},
    query: {},
    cookies: {},
  };

  return req as unknown as FactRequest;
};
