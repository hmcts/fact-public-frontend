import { GET, route } from 'awilix-express';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';

@route('/cookies')
export default class CookiesController {
  @GET()
  public get(req: FactRequest, res: Response): void {
    const data = req.i18n?.getDataByLanguage(req.lng)?.cookies;
    res.render('cookies', data);
  }
}
