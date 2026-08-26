import { GET, route } from 'awilix-express';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';

import BaseController from './BaseController';

@route('/service-not-found')
export class UnknownServiceController extends BaseController {
  @GET()
  public async render(req: FactRequest, res: Response): Promise<void> {
    return this.renderView(req, res, 'unknown-service', 'unknown-service');
  }
}
