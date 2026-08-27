import { GET, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';
import { DataApiRequests } from '../requests/DataApiRequests';
import { CourtBasic } from '../schemas/courtBasicSchema';
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

    if (result === HttpStatusCode.NotFound) {
      return this.renderNotFound(req, res);
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
