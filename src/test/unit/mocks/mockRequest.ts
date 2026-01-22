import { FactRequest } from '../../../main/interfaces/FactRequest';
import { stub } from 'sinon';

export const mockRequest = (data: unknown): FactRequest => {
  const req: any = {
    body: '',
    i18n: {
      getDataByLanguage: stub().returns(data),
    },
    lng: 'en',
    params: {},
  };

  return req as FactRequest;
};
