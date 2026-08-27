import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';
import { DataApiRequests } from '../requests/DataApiRequests';

import BaseController from './BaseController';

@route('/search-by-name')
export default class SearchByLocationController extends BaseController {
  public constructor(private readonly dataApiRequests: DataApiRequests = new DataApiRequests()) {
    super();
  }

  @GET()
  public async get(req: FactRequest, res: Response): Promise<void> {
    const searchQuery = this.normaliseSearchQuery(req.query?.search);

    if (searchQuery === undefined) {
      return this.renderView(req, res, 'search/location', 'search.location');
    }

    if (this.renderValidationError(req, res, searchQuery)) {
      return;
    }

    const courts = await this.dataApiRequests.getByName(searchQuery);
    // If lookup fails, `getByName` returns a status code rather than results, so render the standard error page.
    if (!Array.isArray(courts)) {
      return this.renderError(req, res, HttpStatusCode.ServiceUnavailable);
    }

    return this.renderView(req, res, 'search/location', 'search.location', {
      hasSearched: true,
      search: searchQuery,
      results: courts,
    });
  }

  @POST()
  public post(req: FactRequest, res: Response): void {
    const searchQuery = this.normaliseSearchQuery(req.body?.search);

    if (searchQuery === undefined) {
      return this.renderView(req, res, 'search/location', 'search.location', { errorType: 'blank' });
    }

    if (this.renderValidationError(req, res, searchQuery)) {
      return;
    }

    return res.redirect(`/search-by-name?search=${encodeURIComponent(searchQuery)}`);
  }

  private normaliseSearchQuery(rawSearch: unknown): string | undefined {
    return typeof rawSearch === 'string' ? rawSearch.trim() : undefined;
  }

  private renderValidationError(req: FactRequest, res: Response, searchQuery: string): boolean {
    if (!searchQuery) {
      this.renderView(req, res, 'search/location', 'search.location', { errorType: 'blank' });
      return true;
    }

    if (searchQuery.length < 3) {
      this.renderView(req, res, 'search/location', 'search.location', {
        errorType: 'tooShort',
        search: searchQuery,
      });
      return true;
    }

    return false;
  }
}
