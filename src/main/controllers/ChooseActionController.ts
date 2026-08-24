import { GET, POST, route } from 'awilix-express';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';
import { isValidAction } from '../utils/validationUtils';

import BaseController from './BaseController';

@route('/service-choose-action')
export default class ChooseActionController extends BaseController {
  @GET()
  public render(req: FactRequest, res: Response): void {
    this.renderView(req, res, 'choose-action', 'choose-action');
  }

  @POST()
  public continue(req: FactRequest, res: Response): void {
    if (isValidAction(req.body?.action)) {
      res.redirect(`/services/${req.body.action}`);
    } else {
      this.renderView(req, res, 'choose-action', 'choose-action', { errors: true });
    }
  }
}
