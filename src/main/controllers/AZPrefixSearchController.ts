import { GET, route } from 'awilix-express';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';
import { isDataApiError } from '../requests/DataApiError';
import { DataApiRequests } from '../requests/DataApiRequests';
import { CourtSearchResult } from '../schemas/courtSchema';
import { isValidPrefix } from '../utils/validationUtils';

import BaseController from './BaseController';

type PrefixSearchLocale = Record<string, unknown> & {
  error: {
    api: string;
    invalidPrefix: string;
  };
};

@route('/services/search-by-prefix')
export default class AZPrefixSearchController extends BaseController {
  public constructor(private readonly dataApiRequests: DataApiRequests = new DataApiRequests()) {
    super();
  }

  @GET()
  public async get(req: FactRequest, res: Response): Promise<void> {
    const data = this.getLocaleData<PrefixSearchLocale>(req, 'prefix-search');
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
    const result = await this.dataApiRequests.getCourtsByPrefix(prefix);

    if (isDataApiError(result)) {
      return res.status(result.status).render('prefix-search', {
        ...data,
        errors: true,
        errorMessage: data.error.api,
        prefix,
      });
    }

    const courts = result as CourtSearchResult[];

    return res.render('prefix-search', {
      ...data,
      prefix,
      results: courts,
    });
  }
}
