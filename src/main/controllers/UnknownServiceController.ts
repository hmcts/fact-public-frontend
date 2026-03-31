import { GET, route } from 'awilix-express';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';

@route('/service-not-found')
export class UnknownServiceController {
  @GET()
  public async render(req: FactRequest, res: Response): Promise<void> {
    return res.render('unknown-service', req.i18n.getDataByLanguage(req.lng)['unknown-service']);
  }
}
