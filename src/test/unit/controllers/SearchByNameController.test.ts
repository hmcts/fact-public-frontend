/* eslint-disable jest/expect-expect */
import { Response } from 'express';
import { mock } from 'sinon';

import SearchByLocationController from '../../../main/controllers/SearchByLocationController';
import { mockRequest } from '../mocks/mockRequest';

describe('SearchByNameController', () => {
  test('renders the search by name view', () => {
    const controller = new SearchByLocationController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const data = { title: 'Search by name' };
    const request = mockRequest({ search: { byName: data } });
    const responseMock = mock(response);

    responseMock.expects('render').once().withArgs('search/by-name', data);
    controller.get(request, response);
    responseMock.verify();
  });
});
