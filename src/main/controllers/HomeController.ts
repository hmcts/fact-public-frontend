import { GET, route } from 'awilix-express';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';

@route('/')
export default class HomeController {
  @GET()
  public get(req: FactRequest, res: Response): void {
    const data = req.i18n.getDataByLanguage(req.lng)?.home;
    res.render('home', data);
  }
}
