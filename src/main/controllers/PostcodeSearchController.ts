import { GET, POST, route } from 'awilix-express';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';
import { DataApiRequests } from '../requests/DataApiRequests';
import { ServiceArea } from '../schemas/ServiceAreaSchema';
import { calculateServiceAreaFromSlug, calculateServiceNameFromSlug } from '../utils/SchemaUtils';
import { checkPostcode } from '../utils/validationUtils';

const CHILDCARE_SERVICE_LIST = new Set(['childcare-arrangements']);

const dataApiRequests = new DataApiRequests();

@route('/services/:service/:serviceArea/:action/search-by-postcode')
@route('/search-by-postcode')
export default class PostcodeSearchController {
  @GET()
  public async render(req: FactRequest, res: Response): Promise<void> {
    return this.renderPostcodeSearchPage(req, res);
  }

  @POST()
  public async continue(req: FactRequest, res: Response): Promise<void> {
    const noServiceSearch: boolean = req.params?.service === undefined;
    // check postcode is valid
    const postcode = req.body?.postcode;
    const errorType = checkPostcode(postcode);
    if (errorType) {
      return this.renderPostcodeSearchPage(req, res, errorType);
    } else if (noServiceSearch) {
      const result = await dataApiRequests.performPostcodeOnlySearch(postcode);
      if (!Array.isArray(result) || result.length === 0) {
        return this.renderPostcodeSearchPage(req, res, undefined, true);
      } else {
        // TODO: render postcode results!
        return this.renderPostcodeSearchPage(req, res);
      }
    } else {
      try {
        const service = await calculateServiceNameFromSlug(req.params.service as string);
        const serviceArea = await calculateServiceAreaFromSlug(service, req.params.serviceArea as string);
        const action = req.params.action as string;
        const result = await dataApiRequests.performPostcodeSearch(postcode, serviceArea.name, action);
        if (!Array.isArray(result) || result.length === 0) {
          return this.renderPostcodeSearchPage(req, res, undefined, true);
        } else {
          // TODO: render postcode results!
          return this.renderPostcodeSearchPage(req, res);
        }
      } catch {
        return res.status(404).render('not-found', req.i18n.getDataByLanguage(req.lng)['not-found']);
      }
    }
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
        const service = await calculateServiceNameFromSlug(req.params.service as string);
        const serviceArea = await calculateServiceAreaFromSlug(service, req.params.serviceArea as string);
        serviceAreaLocalised = this.localiseServiceAreaName(serviceArea, req);
      } catch {
        return res.status(404).render('not-found', req.i18n.getDataByLanguage(req.lng)['not-found']);
      }
    }
    res.render('postcode-search', {
      ...req.i18n.getDataByLanguage(req.lng)['postcode-search'],
      serviceAreaLocalised,
      serviceAreaIsChildcare: CHILDCARE_SERVICE_LIST.has(req.params?.serviceArea as string),
      errorType: errorType || null,
      error: errorType !== undefined,
      hasNoResults,
      noServiceSearch,
    });
  }

  private localiseServiceAreaName(serviceArea: ServiceArea, req: FactRequest): string {
    return req.lng === 'cy' ? serviceArea.nameCy : serviceArea.name;
  }
}
