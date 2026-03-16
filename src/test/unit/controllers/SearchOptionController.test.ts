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

  test('redirects to search-by-name when knowsLocation is yes', () => {
    const controller = new SearchOptionController();
    const response = {
      redirect: () => '',
    } as unknown as Response;
    const request = mockRequest({ search: { option: {} } });
    request.body = { knowsLocation: 'yes' };
    const responseMock = mock(response);

    responseMock.expects('redirect').once().withArgs('/search-by-name');
    controller.post(request, response);
    responseMock.verify();
  });

  test('redirects to service-choose-action when knowsLocation is no', () => {
    const controller = new SearchOptionController();
    const response = {
      redirect: () => '',
    } as unknown as Response;
    const request = mockRequest({ search: { option: {} } });
    request.body = { knowsLocation: 'no' };
    const responseMock = mock(response);

    responseMock.expects('redirect').once().withArgs('/service-choose-action');
    controller.post(request, response);
    responseMock.verify();
  });

  test('renders validation error when knowsLocation is missing', () => {
    const controller = new SearchOptionController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const optionData = { title: 'What is the court name?' };
    const request = mockRequest({ search: { option: optionData } });
    request.body = {};
    const responseMock = mock(response);

    responseMock
      .expects('render')
      .once()
      .withArgs('search/option', { ...optionData, errors: true });
    controller.post(request, response);
    responseMock.verify();
  });

  test('renders validation error for unexpected knowsLocation value', () => {
    const controller = new SearchOptionController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const optionData = { title: 'What is the court name?' };
    const request = mockRequest({ search: { option: optionData } });
    request.body = { knowsLocation: 'postcode' };
    const responseMock = mock(response);

    responseMock
      .expects('render')
      .once()
      .withArgs('search/option', { ...optionData, errors: true });
    controller.post(request, response);
    responseMock.verify();
  });
});
