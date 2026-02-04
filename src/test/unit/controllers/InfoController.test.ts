/* eslint-disable jest/expect-expect */
import { Response } from 'express';
import { assert, match, mock, stub } from 'sinon';
import type { SinonStub } from 'sinon';

import InfoController from '../../../main/controllers/InfoController';

jest.mock('@hmcts/info-provider', () => {
  const sinonLib = require('sinon');
  return {
    infoRequestHandler: sinonLib.stub(),
    InfoContributor: jest.fn().mockImplementation(() => ({})),
  };
});

jest.mock('../../../main/requests/DataApiRequests', () => {
  return {
    DataApiRequests: jest.fn().mockImplementation(() => ({
      checkHealth: jest.fn().mockResolvedValue(true),
    })),
  };
});

describe('InfoController', () => {
  test('delegates to infoRequestHandler', async () => {
    const infoProvider = require('@hmcts/info-provider');
    const infoRequestHandlerStub = infoProvider.infoRequestHandler as SinonStub;
    const handler = stub();
    infoRequestHandlerStub.returns(handler);

    const controller = new InfoController();
    const request = {} as never;
    const response = {
      end: () => '',
    } as unknown as Response;
    const responseMock = mock(response);
    const next = stub();

    responseMock.expects('end').never();
    await controller.get(request, response, next);

    assert.calledOnce(infoRequestHandlerStub);
    assert.calledWithMatch(infoRequestHandlerStub, {
      extraBuildInfo: match({ name: 'FaCT Public Frontend', dataApiUp: true }),
      info: match.has('DataApi'),
    });
    assert.calledWith(handler, request, response, next);
    responseMock.verify();
  });
});
