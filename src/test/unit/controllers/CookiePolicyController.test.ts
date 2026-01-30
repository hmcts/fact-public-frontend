/* eslint-disable jest/expect-expect */
import { Response } from 'express';
import { mock } from 'sinon';

import CookiePolicyController from '../../../main/controllers/CookiePolicyController';
import { mockRequest } from '../mocks/mockRequest';

describe('CookiePolicyController', () => {
  test('renders the cookie policy view', () => {
    const controller = new CookiePolicyController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const cookiePolicyData = { header: 'Cookie Policy' };
    const request = mockRequest({ cookiePolicy: cookiePolicyData });
    const responseMock = mock(response);

    responseMock.expects('render').once().withArgs('cookie-policy', cookiePolicyData);
    controller.get(request, response);
    responseMock.verify();
  });
});
