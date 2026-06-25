import { GET, route } from 'awilix-express';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';

@route('/service-centres')
export default class ServiceCentreController {
  @route('/:slug')
  @GET()
  public get(_req: FactRequest, res: Response): void {
    return res.render('service-centre');
  }
}
