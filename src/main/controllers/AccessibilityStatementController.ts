import { GET, route } from 'awilix-express';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';

import BaseController from './BaseController';

@route('/accessibility-statement')
export default class AccessibilityStatementController extends BaseController {
  @GET()
  public get(req: FactRequest, res: Response): void {
    this.renderView(req, res, 'accessibility-statement', 'accessibilityStatement');
  }
}
