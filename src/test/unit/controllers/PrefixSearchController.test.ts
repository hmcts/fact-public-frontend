import { HttpStatusCode } from 'axios';
import { Response } from 'express';
import { mock } from 'sinon';

const mockGetCourtsByPrefix = jest.fn();

jest.mock('../../../main/requests/DataApiRequests', () => ({
  DataApiRequests: jest.fn().mockImplementation(() => ({
    getCourtsByPrefix: mockGetCourtsByPrefix,
  })),
}));

import PrefixSearchController from '../../../main/controllers/PrefixSearchController';
import { mockRequest } from '../mocks/mockRequest';

describe('PrefixSearchController', () => {
  const controller = new PrefixSearchController();
  const mockPageData = { title: 'Search by prefix' };
  const mockNotFoundData = { title: 'Not found' };
  const mockData = {
    'prefix-search': mockPageData,
    'not-found': mockNotFoundData,
  };

  test('renders the prefix-search view without a prefix', async () => {
    const request = mockRequest(mockData);
    request.query = {};
    const response = {
      render: () => '',
    } as unknown as Response;
    const responseMock = mock(response);

    responseMock.expects('render').once().withArgs('prefix-search', mockPageData);

    await controller.get(request, response);
    responseMock.verify();
    expect(mockGetCourtsByPrefix).toHaveBeenCalledTimes(0);
  });

  test('renders the prefix-search view with results when a prefix is provided', async () => {
    const request = mockRequest(mockData);
    const prefix = 'A';
    request.query = { prefix };
    const mockCourts = [{ name: 'A-Court', slug: 'a-court' }];
    mockGetCourtsByPrefix.mockResolvedValue(mockCourts);

    const response = {
      render: () => '',
    } as unknown as Response;
    const responseMock = mock(response);

    responseMock
      .expects('render')
      .once()
      .withArgs('prefix-search', {
        ...mockPageData,
        prefix,
        results: mockCourts,
      });

    await controller.get(request, response);
    responseMock.verify();
    expect(mockGetCourtsByPrefix).toHaveBeenCalledWith(prefix);
  });

  test('renders the not-found view when API returns 404', async () => {
    const request = mockRequest(mockData);
    const prefix = 'Z';
    request.query = { prefix };
    mockGetCourtsByPrefix.mockResolvedValue(HttpStatusCode.NotFound);

    const response = {
      status: () => '',
    } as unknown as Response;
    const responseMock = mock(response);
    const statusObj = {
      render: () => '',
    };
    const statusMock = mock(statusObj);

    responseMock.expects('status').once().withArgs(404).returns(statusObj);
    statusMock.expects('render').once().withArgs('not-found', mockNotFoundData);

    await controller.get(request, response);
    responseMock.verify();
    statusMock.verify();
    expect(mockGetCourtsByPrefix).toHaveBeenCalled();
  });

  test('renders the prefix-search view with error when API returns other error', async () => {
    const request = mockRequest(mockData);
    const prefix = 'A';
    request.query = { prefix };
    mockGetCourtsByPrefix.mockResolvedValue(HttpStatusCode.InternalServerError);

    const response = {
      render: () => '',
    } as unknown as Response;
    const responseMock = mock(response);

    responseMock
      .expects('render')
      .once()
      .withArgs('prefix-search', {
        ...mockPageData,
        error: true,
      });

    await controller.get(request, response);
    responseMock.verify();
    expect(mockGetCourtsByPrefix).toHaveBeenCalled();
  });
});
