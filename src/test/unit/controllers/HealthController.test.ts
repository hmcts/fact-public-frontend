/* eslint-disable jest/expect-expect */
import { Response } from 'express';
import { assert, match, mock, stub } from 'sinon';
import type { SinonStub } from 'sinon';

const healthcheck = {
  raw: stub().callsFake((fn: () => unknown) => fn),
  up: stub().returns({ status: 'UP' }),
  down: stub().returns({ status: 'DOWN' }),
};

const healthRoutes = {
  configure: stub(),
  checkReadiness: stub(),
};

const outputs = {
  UP: 'UP',
  status: stub().callsFake((value: string) => ({ status: value })),
};

jest.mock('@hmcts/nodejs-healthcheck', () => healthcheck);
jest.mock('@hmcts/nodejs-healthcheck/healthcheck/routes', () => healthRoutes);
jest.mock('@hmcts/nodejs-healthcheck/healthcheck/outputs', () => outputs);
jest.mock('../../../main/app', () => ({ app: { locals: { shutdown: false } } }));

import HealthController from '../../../main/controllers/HealthController';
import { DataApiRequests } from '../../../main/requests/DataApiRequests';

const appModule = require('../../../main/app') as { app: { locals: { shutdown: boolean } } };

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

    healthRoutes.configure.callsFake(() => configureHandler);
    healthRoutes.checkReadiness.callsFake(() => readinessHandler);

    configureMock = healthRoutes.configure;
    checkReadinessMock = healthRoutes.checkReadiness;
    statusMock = outputs.status;
    rawMock = healthcheck.raw;
    upMock = healthcheck.up;
    downMock = healthcheck.down;

    configureHandler.resetHistory();
    readinessHandler.resetHistory();
    configureMock.resetHistory();
    checkReadinessMock.resetHistory();
    statusMock.resetHistory();
    rawMock.resetHistory();
    upMock.resetHistory();
    downMock.resetHistory();
    appModule.app.locals.shutdown = false;
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

  test('dataApiCheck reports UP when Data API is healthy', async () => {
    const checkHealthSpy = jest.spyOn(DataApiRequests.prototype, 'checkHealth').mockResolvedValue(true);
    const controller = new HealthController();

    const dataApiCheck = (
      controller as unknown as {
        healthCheckConfig: {
          checks: {
            dataApiCheck: () => Promise<{ status: string }>;
          };
        };
      }
    ).healthCheckConfig.checks.dataApiCheck;

    await expect(dataApiCheck()).resolves.toEqual({ status: 'UP' });
    expect(checkHealthSpy).toHaveBeenCalledTimes(1);

    checkHealthSpy.mockRestore();
  });

  test('dataApiCheck reports DOWN when Data API is unhealthy', async () => {
    const checkHealthSpy = jest.spyOn(DataApiRequests.prototype, 'checkHealth').mockResolvedValue(false);
    const controller = new HealthController();

    const dataApiCheck = (
      controller as unknown as {
        healthCheckConfig: {
          checks: {
            dataApiCheck: () => Promise<{ status: string }>;
          };
        };
      }
    ).healthCheckConfig.checks.dataApiCheck;

    await expect(dataApiCheck()).resolves.toEqual({ status: 'DOWN' });
    expect(checkHealthSpy).toHaveBeenCalledTimes(1);

    checkHealthSpy.mockRestore();
  });

  test('shutdown readiness check reports DOWN when shutdown is active', () => {
    appModule.app.locals.shutdown = true;
    const controller = new HealthController();

    const shutdownCheck = (
      controller as unknown as {
        healthCheckConfig: {
          readinessChecks: {
            shutdownCheck: () => { status: string };
          };
        };
      }
    ).healthCheckConfig.readinessChecks.shutdownCheck;

    expect(shutdownCheck()).toEqual({ status: 'DOWN' });
  });

  test('shutdown readiness check reports UP when shutdown is inactive', () => {
    appModule.app.locals.shutdown = false;
    const controller = new HealthController();

    const shutdownCheck = (
      controller as unknown as {
        healthCheckConfig: {
          readinessChecks: {
            shutdownCheck: () => { status: string };
          };
        };
      }
    ).healthCheckConfig.readinessChecks.shutdownCheck;

    expect(shutdownCheck()).toEqual({ status: 'UP' });
  });
});
