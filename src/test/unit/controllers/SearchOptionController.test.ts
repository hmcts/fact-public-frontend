/* eslint-disable jest/expect-expect */
import { Response } from 'express';
import { mock } from 'sinon';

import SearchOptionController from '../../../main/controllers/SearchOptionController';
import { mockRequest } from '../mocks/mockRequest';

describe('SearchOptionController', () => {
  test('renders the search option view', () => {
    const controller = new SearchOptionController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const data = { title: 'What is the court name?' };
    const request = mockRequest({ search: { option: data } });
    const responseMock = mock(response);

    responseMock.expects('render').once().withArgs('search/option', data);
    controller.get(request, response);
    responseMock.verify();
  });
});
