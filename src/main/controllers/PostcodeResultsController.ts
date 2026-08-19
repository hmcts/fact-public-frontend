import { GET, route } from 'awilix-express';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';
import { DataApiRequests } from '../requests/DataApiRequests';
import { ServiceArea } from '../schemas/ServiceAreaSchema';
import { postcodeSearchRedirect, servicePostcodeSearchRedirect } from '../utils/RedirectUtils';
import { calculateServiceAreaFromSlug, calculateServiceNameFromSlug } from '../utils/SchemaUtils';
import { checkPostcode, isValidPostcode } from '../utils/validationUtils';

const DIVORCE_OR_CIVIL_SERVICE_LIST = new Set(['divorce', 'civil-partnership']);

const dataApiRequests = new DataApiRequests();

@route('/services/:service/:serviceArea/:action/search-by-postcode/courts/near')
@route('/search-by-postcode/courts/near')
export default class PostcodeResultsController {
  @GET()
  public async get(req: FactRequest, res: Response): Promise<void> {
    const noServiceSearch: boolean = req.params?.service === undefined;
    const postcode = req.query.postcode as string;
    const serviceArea = req.params?.serviceArea as string | undefined;
    if (isValidPostcode(postcode, serviceArea)) {
      // perform the appropriate search based on the @route used to get here
      if (noServiceSearch) {
        return this.performPostcodeOnlySearch(req, res, postcode);
      } else {
        return this.performServiceAreaPostcodeSearch(req, res, postcode);
      }
    }
    const errorType = checkPostcode(postcode, serviceArea);
    // postcode is invalid, so redirect to the appropriate search page with and error message
    if (noServiceSearch) {
      return postcodeSearchRedirect(res, errorType);
    }
    try {
      // if any of these fail to resolve, then the slugs in the URL
      // are invalid, and we should return a 404
      const service = req.params.service as string;
      const serviceAreaAsString = req.params.serviceArea as string;
      const action = req.params.action as string;
      return servicePostcodeSearchRedirect(res, service, serviceAreaAsString, action, errorType);
    } catch {
      return res.status(404).render('not-found', req.i18n.getDataByLanguage(req.lng)['not-found']);
    }
  }

  private async performServiceAreaPostcodeSearch(req: FactRequest, res: Response, postcode: string) {
    try {
      const service = await calculateServiceNameFromSlug(req.params.service as string);
      const serviceArea = await calculateServiceAreaFromSlug(service, req.params.serviceArea as string);
      const action = req.params.action as string;
      const results = await dataApiRequests.performPostcodeSearch(postcode, serviceArea.name, action);
      if (!Array.isArray(results) || (Array.isArray(results) && results.length === 0)) {
        return servicePostcodeSearchRedirect(res, req.params.service as string, serviceArea.slug, action, null, true);
      }
      const data = {
        ...req.i18n.getDataByLanguage(req.lng)['postcode-results'],
        results: {
          locations: results,
        },
        postcodeOnlySearch: false,
        serviceArea: this.localiseServiceAreaName(serviceArea, req).toLowerCase(),
        postcode,
        isDivorceOrCivil: DIVORCE_OR_CIVIL_SERVICE_LIST.has(req.params.serviceArea as string),
        onlineText: this.localiseOnlineText(serviceArea, req),
        onlineUrl: serviceArea.onlineUrl,
      };
      return res.render('postcode-results', data);
    } catch {
      return res.status(404).render('not-found', req.i18n.getDataByLanguage(req.lng)['not-found']);
    }
  }

  private async performPostcodeOnlySearch(req: FactRequest, res: Response, postcode: string) {
    const results = await dataApiRequests.performPostcodeOnlySearch(postcode);
    if (!Array.isArray(results) || (Array.isArray(results) && results.length === 0)) {
      return postcodeSearchRedirect(res, null, true);
    } else {
      const data = {
        ...req.i18n.getDataByLanguage(req.lng)['postcode-results'],
        results: {
          courts: results,
        },
        postcodeOnlySearch: true,
        postcode,
      };
      return res.render('postcode-results', data);
    }
  }

  private localiseServiceAreaName(serviceArea: ServiceArea, req: FactRequest): string {
    return req.lng === 'cy' ? serviceArea.nameCy : serviceArea.name;
  }

  private localiseOnlineText(serviceArea: ServiceArea, req: FactRequest): string | null {
    return req.lng === 'cy' && serviceArea.onlineTextCy ? serviceArea.onlineTextCy : serviceArea.onlineText;
  }
}
