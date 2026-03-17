import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';
import { DataApiRequests } from '../requests/DataApiRequests';

const dataApiRequests = new DataApiRequests();

@route('/search-by-name')
export default class SearchByLocationController {
  @GET()
  public async get(req: FactRequest, res: Response): Promise<void> {
    const data = req.i18n.getDataByLanguage(req.lng).search.location;
    const searchQuery = this.normaliseSearchQuery(req.query?.search);

    if (searchQuery === undefined) {
      return res.render('search/location', data);
    }

    if (this.renderValidationError(res, data, searchQuery)) {
      return;
    }

    const courts = await dataApiRequests.getByName(searchQuery);
    // If lookup fails, `getByName` returns a status code rather than results, so render the standard error page.
    if (!Array.isArray(courts)) {
      return res.status(HttpStatusCode.ServiceUnavailable).render('error', req.i18n.getDataByLanguage(req.lng).error);
    }

    return res.render('search/location', { ...data, hasSearched: true, search: searchQuery, results: courts });
  }

  @POST()
  public post(req: FactRequest, res: Response): void {
    const data = req.i18n.getDataByLanguage(req.lng).search.location;
    const searchQuery = this.normaliseSearchQuery(req.body?.search);

    if (searchQuery === undefined) {
      return res.render('search/location', { ...data, errorType: 'blank' });
    }

    if (this.renderValidationError(res, data, searchQuery)) {
      return;
    }

    return res.redirect(`/search-by-name?search=${encodeURIComponent(searchQuery)}`);
  }

  private normaliseSearchQuery(rawSearch: unknown): string | undefined {
    return typeof rawSearch === 'string' ? rawSearch.trim() : undefined;
  }

  private renderValidationError(
    res: Response,
    data: object,
    searchQuery: string
  ): boolean {
    if (!searchQuery) {
      res.render('search/location', { ...data, errorType: 'blank' });
      return true;
    }

    if (searchQuery.length < 3) {
      res.render('search/location', { ...data, errorType: 'tooShort', search: searchQuery });
      return true;
    }

    return false;
  }
}
