import { GET, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';
import { DataApiRequests } from '../requests/DataApiRequests';
import { CourtBasic } from '../schemas/courtBasicSchema';

const dataApiRequests = new DataApiRequests();

@route('/services/search-by-prefix')
export default class PrefixSearchController {
  @GET()
  public async get(req: FactRequest, res: Response): Promise<void> {
    const data = req.i18n.getDataByLanguage(req.lng)['prefix-search'];
    const prefix = req.query.prefix as string;

    if (!prefix) {
      return res.render('prefix-search', data);
    }

    const result = await dataApiRequests.getCourtsByPrefix(prefix);

    if (result === HttpStatusCode.NotFound) {
      return res.status(404).render('not-found', req.i18n.getDataByLanguage(req.lng)['not-found']);
    }

    if (typeof result === 'number') {
      return res.render('prefix-search', {
        ...data,
        error: true,
      });
    }

    const courts = result as CourtBasic[];

    return res.render('prefix-search', {
      ...data,
      prefix,
      results: courts
    });
  }
}
