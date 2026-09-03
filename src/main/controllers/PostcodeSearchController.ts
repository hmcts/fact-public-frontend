import { GET, POST, route } from 'awilix-express';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';
import { postcodeResultsRedirect, servicePostcodeResultsRedirect } from '../utils/RedirectUtils';
import { calculateServiceAreaFromSlug, calculateServiceNameFromSlug } from '../utils/SchemaUtils';
import { checkPostcode, isValidPostcode } from '../utils/validationUtils';

import BaseController from './BaseController';

const CHILDCARE_SERVICE_AREA_LIST = new Set(['childcare-arrangements-if-you-separate-from-your-partner']);

@route('/services/:service/:serviceArea/:action/search-by-postcode')
@route('/search-by-postcode')
export default class PostcodeSearchController extends BaseController {
  @GET()
  public async render(req: FactRequest, res: Response): Promise<void> {
    return this.renderPostcodeSearchPage(req, res, req.query?.error as string, req.query?.noResults !== undefined);
  }

  @POST()
  public async continue(req: FactRequest, res: Response): Promise<void> {
    const noServiceSearch: boolean = req.params?.service === undefined;
    const postcode = req.body?.postcode;
    const serviceArea = req.params?.serviceArea as string | undefined;
    if (isValidPostcode(postcode, serviceArea)) {
      if (noServiceSearch) {
        return postcodeResultsRedirect(res, postcode);
      }
      try {
        // if any of these fail to resolve, then the slugs in the
        // URL are invalid, and we should return a 404
        const service = req.params.service as string;
        const action = req.params.action as string;
        return servicePostcodeResultsRedirect(res, service, serviceArea as string, action, postcode);
      } catch {
        return this.renderNotFound(req, res);
      }
    }
    // postcode is invalid
    return this.renderPostcodeSearchPage(req, res, checkPostcode(postcode, serviceArea));
  }

  private async renderPostcodeSearchPage(
    req: FactRequest,
    res: Response,
    errorType?: string,
    hasNoResults = false
  ): Promise<void> {
    const noServiceSearch: boolean = req.params?.service === undefined;
    let serviceAreaLocalised: string | undefined;
    if (!noServiceSearch) {
      try {
        // if we're doing a service based search then we need
        // the localised service area to be set for the search
        // template to render correctly.
        const service = await calculateServiceNameFromSlug(req.params.service as string);
        const serviceArea = await calculateServiceAreaFromSlug(service, req.params.serviceArea as string);
        serviceAreaLocalised = this.localise(req, serviceArea.name, serviceArea.nameCy);
      } catch {
        return this.renderNotFound(req, res);
      }
    }
    return this.renderView(req, res, 'postcode-search', 'postcode-search', {
      serviceAreaLocalised,
      serviceAreaIsChildcare: CHILDCARE_SERVICE_AREA_LIST.has(req.params?.serviceArea as string),
      errorType: errorType || null,
      error: errorType !== undefined,
      hasNoResults,
      noServiceSearch,
    });
  }
}
