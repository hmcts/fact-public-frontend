import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { Response } from 'express';

import { UnknownServiceController } from '../../../main/controllers/UnknownServiceController';
import { FactRequest } from '../../../main/interfaces/FactRequest';

describe('UnknownServiceController', () => {
  let req: Partial<FactRequest>;
  let res: Response;

  beforeEach(() => {
    req = {
      i18n: {
        getDataByLanguage: jest.fn().mockReturnValue({ 'unknown-service': { title: 'Unknown Service' } })
      } as unknown as FactRequest['i18n'],
      lng: 'en',
    };
    res = {
      render: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;
  });

  test('renders unknown-service page with correct data', async () => {
    await new UnknownServiceController().render(req as FactRequest, res);
    expect(res.render).toHaveBeenCalledWith('unknown-service', { title: 'Unknown Service' });
  });

});








