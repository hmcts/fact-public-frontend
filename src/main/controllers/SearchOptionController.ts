import { GET, POST, route } from 'awilix-express';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';

import BaseController from './BaseController';

@route('/search-option')
export default class SearchOptionController extends BaseController {
  @GET()
  public get(req: FactRequest, res: Response): void {
    this.renderView(req, res, 'search/option', 'search.option');
  }

  @POST()
  public post(req: FactRequest, res: Response): void {
    const knowsLocation = typeof req.body?.knowsLocation === 'string' ? req.body.knowsLocation : undefined;

    if (!knowsLocation) {
      return this.renderView(req, res, 'search/option', 'search.option', { errors: true });
    }

    switch (knowsLocation) {
      case 'yes':
        return res.redirect('/search-by-name');
      case 'no':
        return res.redirect('/service-choose-action');
      default:
        // Defensive handling for crafted/invalid POST values outside of radio options
        return this.renderView(req, res, 'search/option', 'search.option', { errors: true });
    }
  }
}
