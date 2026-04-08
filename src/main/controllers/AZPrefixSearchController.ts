import { GET, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';
import { DataApiRequests } from '../requests/DataApiRequests';
import { CourtBasic } from '../schemas/courtBasicSchema';
import { isValidPrefix } from '../utils/validationUtils';

const dataApiRequests = new DataApiRequests();

@route('/services/search-by-prefix')
export default class AZPrefixSearchController {
  @GET()
  public async get(req: FactRequest, res: Response): Promise<void> {
    const data = req.i18n.getDataByLanguage(req.lng)['prefix-search'];
    const prefixQuery = req.query.prefix;

    if (!prefixQuery) {
      return res.render('prefix-search', data);
    }

    if (!isValidPrefix(prefixQuery)) {
      return res.render('prefix-search', {
        ...data,
        errors: true,
        errorMessage: data.error.invalidPrefix,
      });
    }

    const prefix = prefixQuery.toUpperCase();
    const result = await dataApiRequests.getCourtsByPrefix(prefix);

    if (result === HttpStatusCode.NotFound) {
      return res.status(404).render('not-found', req.i18n.getDataByLanguage(req.lng)['not-found']);
    }

    if (Object.values(HttpStatusCode).includes(result as HttpStatusCode)) {
      return res.render('prefix-search', {
        ...data,
        errors: true,
        errorMessage: data.error.api,
        prefix,
      });
    }

    const courts = result as CourtBasic[];

    return res.render('prefix-search', {
      ...data,
      prefix,
      results: courts,
    });
  }
}
