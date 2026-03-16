import { GET, route } from 'awilix-express';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';

@route('/search-option')
export default class SearchOptionController {
  @GET()
  public get(req: FactRequest, res: Response): void {
    const data = req.i18n?.getDataByLanguage(req.lng)?.search?.option;
    res.render('search/option', data);
  }
}
