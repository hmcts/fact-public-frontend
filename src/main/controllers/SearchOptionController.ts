import { GET, POST, route } from 'awilix-express';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';

@route('/search-option')
export default class SearchOptionController {
  @GET()
  public get(req: FactRequest, res: Response): void {
    const data = req.i18n.getDataByLanguage(req.lng).search.option;
    res.render('search/option', data);
  }

  @POST()
  public post(req: FactRequest, res: Response): void {
    const data = req.i18n.getDataByLanguage(req.lng).search.option;
    const knowsLocation = typeof req.body?.knowsLocation === 'string' ? req.body.knowsLocation : undefined;

    if (!knowsLocation) {
      return res.render('search/option', { ...data, errors: true });
    }

    switch (knowsLocation) {
      case 'yes':
        return res.redirect('/search-by-name');
      case 'no':
        return res.redirect('/service-choose-action');
      default:
        // Defensive handling for crafted/invalid POST values outside of radio options
        return res.render('search/option', { ...data, errors: true });
    }
  }
}
