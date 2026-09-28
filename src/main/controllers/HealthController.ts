import { GET, route } from 'awilix-express';
import { Request, Response } from 'express';

import { app as myApp } from '../app';
import { DataApiHealthService, dataApiHealthCheck } from '../services/DataApiHealthService';

import BaseController from './BaseController';

const healthcheck = require('@hmcts/nodejs-healthcheck');
const outputs = require('@hmcts/nodejs-healthcheck/healthcheck/outputs');
const healthRoutes = require('@hmcts/nodejs-healthcheck/healthcheck/routes');

@route('/health')
export default class HealthController extends BaseController {
  public constructor(private readonly healthCheck: DataApiHealthService = dataApiHealthCheck) {
    super();
  }

  private readonly healthCheckConfig = {
    checks: {
      dataApiCheck: healthcheck.raw(async () => {
        const result = await this.healthCheck.check();
        if (result.healthy) {
          return result.consecutiveFailures > 0
            ? healthcheck.up({ message: 'Data API protected check temporarily failed' })
            : healthcheck.up();
        }
        return healthcheck.down({ message: 'Data API protected check failed' });
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
