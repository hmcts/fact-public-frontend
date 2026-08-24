import { GET, POST, route } from 'awilix-express';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';
import { DataApiRequests } from '../requests/DataApiRequests';
import { isValidAction } from '../utils/validationUtils';

import BaseController from './BaseController';

@route('/services/:action')
export class ChooseServiceController extends BaseController {
  public constructor(private readonly dataApiRequests: DataApiRequests = new DataApiRequests()) {
    super();
  }

  @GET()
  public async render(req: FactRequest, res: Response): Promise<void> {
    await this.renderInternal(req, res);
  }

  @POST()
  public async continue(req: FactRequest, res: Response): Promise<void> {
    if (req.body?.service) {
      const action = req.params.action as string;
      const service = req.body.service as string;
      if (service === 'not-listed') {
        return res.redirect('/service-not-found');
      }
      // let the service area selection page deal with the potentially invalid action
      res.redirect('/services/' + service + '/service-areas/' + action);
    } else {
      await this.renderInternal(req, res, true);
    }
  }

  private async renderInternal(req: FactRequest, res: Response, err: boolean = false): Promise<void> {
    const action = req.params.action as string;
    if (isValidAction(action)) {
      const result = await this.dataApiRequests.getAllServices();
      if (Array.isArray(result)) {
        return this.renderView(req, res, 'choose-service', 'choose-service', {
          services: this.localiseOptions(req, result),
          errors: err,
        });
      }
    }
    return this.renderNotFound(req, res);
  }
}
