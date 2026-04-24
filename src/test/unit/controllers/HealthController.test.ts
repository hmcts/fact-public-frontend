import { Response } from 'express';
import { assert, match, mock, stub } from 'sinon';
import type { SinonStub } from 'sinon';

jest.mock('@hmcts/nodejs-healthcheck', () => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const { stub } = require('sinon');
  return {
    raw: stub().callsFake((fn: () => unknown) => fn),
    up: stub().returns({ status: 'UP' }),
    down: stub().returns({ status: 'DOWN' }),
  };
});
jest.mock('@hmcts/nodejs-healthcheck/healthcheck/routes', () => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const { stub } = require('sinon');
  return {
    configure: stub(),
    checkReadiness: stub(),
  };
});
jest.mock('@hmcts/nodejs-healthcheck/healthcheck/outputs', () => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const { stub } = require('sinon');
  return {
    UP: 'UP',
    status: stub().callsFake((value: string) => ({ status: value })),
  };
});
jest.mock('../../../main/app', () => ({ app: { locals: { shutdown: false } } }));

import HealthController from '../../../main/controllers/HealthController';

// Retrieve mocks from require after jest.mock
const mockHealthcheck = require('@hmcts/nodejs-healthcheck');
const mockOutputs = require('@hmcts/nodejs-healthcheck/healthcheck/outputs');
const mockHealthRoutes = require('@hmcts/nodejs-healthcheck/healthcheck/routes');

let configureHandler: SinonStub;
let readinessHandler: SinonStub;
let configureMock: SinonStub;
let checkReadinessMock: SinonStub;
let statusMock: SinonStub;
let rawMock: SinonStub;
let upMock: SinonStub;
let downMock: SinonStub;

describe('HealthController', () => {
  beforeEach(() => {
    configureHandler = stub();
    readinessHandler = stub();

    mockHealthRoutes.configure.callsFake(() => configureHandler);
    mockHealthRoutes.checkReadiness.callsFake(() => readinessHandler);

    configureMock = mockHealthRoutes.configure;
    checkReadinessMock = mockHealthRoutes.checkReadiness;
    statusMock = mockOutputs.status;
    rawMock = mockHealthcheck.raw;
    upMock = mockHealthcheck.up;
    downMock = mockHealthcheck.down;

    configureHandler.resetHistory();
    readinessHandler.resetHistory();
    configureMock.resetHistory();
    checkReadinessMock.resetHistory();
    statusMock.resetHistory();
    rawMock.resetHistory();
    upMock.resetHistory();
    downMock.resetHistory();
  });

  test('delegates /health to healthcheck routes', () => {
    const controller = new HealthController();
    const request = {} as never;
    const response = {} as never;

    controller.get(request, response);

    assert.calledWithMatch(configureMock, {
      checks: match.object,
      readinessChecks: match.object,
    });
    assert.calledWith(configureHandler, request, response);
  });

  test('returns liveness status', () => {
    const controller = new HealthController();
    const response = {
      json: () => '',
    } as unknown as Response;
    const responseMock = mock(response);

    responseMock.expects('json').once().withArgs({ status: 'UP' });
    controller.liveness({} as never, response);

    assert.calledWith(statusMock, 'UP');
    responseMock.verify();
  });

  test('delegates /health/readiness to readiness checks', () => {
    const controller = new HealthController();
    const request = {} as never;
    const response = {} as never;

    controller.readiness(request, response);

    assert.calledWithMatch(checkReadinessMock, match.object);
    assert.calledWith(readinessHandler, request, response);
  });
});
