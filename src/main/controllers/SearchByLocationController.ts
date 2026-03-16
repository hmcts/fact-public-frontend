import { GET, route } from 'awilix-express';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';

@route('/search-by-name')
export default class SearchByLocationController {
  @GET()
  public get(req: FactRequest, res: Response): void {
    const data = req.i18n?.getDataByLanguage(req.lng)?.search?.location;
    res.render('search/location', data);
  }
}
