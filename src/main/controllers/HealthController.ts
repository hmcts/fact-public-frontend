import { GET, route } from 'awilix-express';
import { Request, Response } from 'express';

import { app as myApp } from '../app';
import { DataApiRequests } from '../requests/DataApiRequests';

import BaseController from './BaseController';

const healthcheck = require('@hmcts/nodejs-healthcheck');
const outputs = require('@hmcts/nodejs-healthcheck/healthcheck/outputs');
const healthRoutes = require('@hmcts/nodejs-healthcheck/healthcheck/routes');

@route('/health')
export default class HealthController extends BaseController {
  private readonly dataApiRequests = new DataApiRequests();

  private readonly healthCheckConfig = {
    checks: {
      dataApiCheck: healthcheck.raw(async () => {
        return (await this.dataApiRequests.checkHealth())
          ? healthcheck.up()
          : healthcheck.down({ message: 'Data API health check failed' });
      }),
    },
    readinessChecks: {
      shutdownCheck: healthcheck.raw(() => {
        return this.shutdownCheck() ? healthcheck.down() : healthcheck.up();
      }),
    },
  };

  @GET()
  public get(req: Request, res: Response): void {
    return healthRoutes.configure(this.healthCheckConfig)(req, res);
  }

  @route('/liveness')
  @GET()
  public liveness(_req: Request, res: Response): void {
    res.json(outputs.status(outputs.UP));
  }

  @route('/readiness')
  @GET()
  public readiness(req: Request, res: Response): void {
    return healthRoutes.checkReadiness(this.healthCheckConfig.readinessChecks)(req, res);
  }

  private shutdownCheck(): boolean {
    return myApp.locals.shutdown;
  }
}
