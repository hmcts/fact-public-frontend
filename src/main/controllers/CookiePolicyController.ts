import { GET, route } from 'awilix-express';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';

@route('/cookie-policy')
export default class CookiePolicyController {
  @GET()
  public get(req: FactRequest, res: Response): void {
    const data = req.i18n?.getDataByLanguage(req.lng)?.cookiePolicy;
    res.render('cookie-policy', data);
  }
}
