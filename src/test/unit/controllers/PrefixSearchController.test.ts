import { HttpStatusCode } from 'axios';
import { Response } from 'express';
import { mock } from 'sinon';

import AZPrefixSearchController from '../../../main/controllers/AZPrefixSearchController';
import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import { mockRequest } from '../mocks/mockRequest';

const mockGetCourtsByPrefix = jest.fn();
const dataApiRequests = { getCourtsByPrefix: mockGetCourtsByPrefix } as unknown as DataApiRequests;

describe('AZPrefixSearchController', () => {
  const controller = new AZPrefixSearchController(dataApiRequests);
  const mockPageData = {
    title: 'Search by prefix',
    error: {
      invalidPrefix: 'Enter a single letter from A to Z',
      api: 'Please try again soon or contact us through the feedback page',
    },
  };
  const mockNotFoundData = { title: 'Not found' };
  const mockData = {
    'prefix-search': mockPageData,
    'not-found': mockNotFoundData,
  };

  beforeEach(() => {
    mockGetCourtsByPrefix.mockReset();
  });

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

  test('renders the prefix-search view with a validation error for an invalid prefix query', async () => {
    const request = mockRequest(mockData);
    request.query = { prefix: 'bb' };

    const response = {
      render: () => '',
    } as unknown as Response;
    const responseMock = mock(response);

    responseMock
      .expects('render')
      .once()
      .withArgs('prefix-search', {
        ...mockPageData,
        errors: true,
        errorMessage: mockPageData.error.invalidPrefix,
      });

    await controller.get(request, response);
    responseMock.verify();
    expect(mockGetCourtsByPrefix).not.toHaveBeenCalled();
  });

  test('normalises a valid lowercase prefix before calling the API', async () => {
    const request = mockRequest(mockData);
    request.query = { prefix: 'a' };
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
        prefix: 'A',
        results: mockCourts,
      });

    await controller.get(request, response);
    responseMock.verify();
    expect(mockGetCourtsByPrefix).toHaveBeenCalledWith('A');
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
        errors: true,
        errorMessage: mockPageData.error.api,
        prefix,
      });

    await controller.get(request, response);
    responseMock.verify();
    expect(mockGetCourtsByPrefix).toHaveBeenCalled();
  });
});
