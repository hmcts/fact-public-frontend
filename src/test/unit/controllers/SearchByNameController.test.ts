/* eslint-disable jest/expect-expect */
import { Response } from 'express';
import { mock } from 'sinon';

const mockGetByName = jest.fn();

jest.mock('../../../main/requests/DataApiRequests', () => ({
  DataApiRequests: jest.fn().mockImplementation(() => ({
    getByName: mockGetByName,
  })),
}));

import SearchByLocationController from '../../../main/controllers/SearchByLocationController';
import { FactRequest } from '../../../main/interfaces/FactRequest';
import { mockRequest } from '../mocks/mockRequest';

describe('SearchByLocationController', () => {
  beforeEach(() => {
    mockGetByName.mockReset();
  });

  test('renders the search by location view', async () => {
    const controller = new SearchByLocationController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const data = { title: 'Search by name or address' };
    const request = mockRequest({ search: { location: data } });
    const responseMock = mock(response);

    responseMock.expects('render').once().withArgs('search/location', data);
    await controller.get(request, response);
    responseMock.verify();
  });

  test('renders validation error for too-short search query on get', async () => {
    const controller = new SearchByLocationController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const data = { errorTooShort: { text: 'Search must be 3 characters or more' } };
    const request = mockRequest({ search: { location: data } });
    request.query = { search: 'ab' } as FactRequest['query'];
    const responseMock = mock(response);

    responseMock
      .expects('render')
      .once()
      .withArgs('search/location', { ...data, errorType: 'tooShort', search: 'ab' });
    await controller.get(request, response);
    responseMock.verify();
  });

  test('renders results when valid search query is on get', async () => {
    const controller = new SearchByLocationController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const data = { title: 'Search by name or address' };
    const request = mockRequest({ search: { location: data } });
    request.query = { search: 'Blackburn' } as FactRequest['query'];
    const results = [{ name: 'Blackburn Family Court', slug: 'blackburn-family-court' }];
    mockGetByName.mockResolvedValueOnce(results);
    const responseMock = mock(response);

    responseMock
      .expects('render')
      .once()
      .withArgs('search/location', { ...data, hasSearched: true, search: 'Blackburn', results });
    await controller.get(request, response);
    expect(mockGetByName).toHaveBeenCalledWith('Blackburn');
    responseMock.verify();
  });

  test('renders service error page when API lookup fails on get', async () => {
    const controller = new SearchByLocationController();
    const response = {
      status: () => response,
      render: () => '',
    } as unknown as Response;
    const data = { title: 'Search by name or address' };
    const request = mockRequest({ search: { location: data }, error: { h1: 'Something went wrong' } });
    request.query = { search: 'Blackburn' } as FactRequest['query'];
    mockGetByName.mockResolvedValueOnce(500);
    const responseMock = mock(response);

    responseMock.expects('status').once().withArgs(503).returns(response);
    responseMock.expects('render').once().withArgs('error', { h1: 'Something went wrong' });
    await controller.get(request, response);
    responseMock.verify();
  });

  test('renders validation error for blank search on post', () => {
    const controller = new SearchByLocationController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const data = { errorBlank: { text: 'Enter a court name, address, town or city' } };
    const request = mockRequest({ search: { location: data } });
    request.body = { search: '' };
    const responseMock = mock(response);

    responseMock
      .expects('render')
      .once()
      .withArgs('search/location', { ...data, errorType: 'blank' });
    controller.post(request, response);
    responseMock.verify();
  });

  test('renders validation error for too-short search on post', () => {
    const controller = new SearchByLocationController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const data = { errorTooShort: { text: 'Search must be 3 characters or more' } };
    const request = mockRequest({ search: { location: data } });
    request.body = { search: 'ab' };
    const responseMock = mock(response);

    responseMock
      .expects('render')
      .once()
      .withArgs('search/location', { ...data, errorType: 'tooShort', search: 'ab' });
    controller.post(request, response);
    responseMock.verify();
  });

  test('redirects to GET search page with query on valid post', () => {
    const controller = new SearchByLocationController();
    const response = {
      redirect: () => '',
    } as unknown as Response;
    const data = { title: 'Search by name or address' };
    const request = mockRequest({ search: { location: data } });
    request.body = { search: 'Blackburn Family Court' };
    const responseMock = mock(response);

    responseMock.expects('redirect').once().withArgs('/search-by-name?search=Blackburn%20Family%20Court');
    controller.post(request, response);
    responseMock.verify();
  });
});
