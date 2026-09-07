import { GET, route } from 'awilix-express';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';
import { DataApiRequests } from '../requests/DataApiRequests';
import { postcodeSearchRedirect, servicePostcodeSearchRedirect } from '../utils/RedirectUtils';
import { calculateServiceAreaFromSlug, calculateServiceNameFromSlug } from '../utils/SchemaUtils';
import { checkPostcode, isValidPostcode } from '../utils/validationUtils';

import BaseController from './BaseController';

const DIVORCE_OR_CIVIL_SERVICE_LIST = new Set(['divorce', 'civil-partnership']);

@route('/services/:service/:serviceArea/:action/search-by-postcode/courts/near')
@route('/search-by-postcode/courts/near')
export default class PostcodeSearchController extends BaseController {
  public constructor(private readonly dataApiRequests: DataApiRequests = new DataApiRequests()) {
    super();
  }

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
      return this.renderNotFound(req, res);
    }
  }

  private async performServiceAreaPostcodeSearch(req: FactRequest, res: Response, postcode: string) {
    try {
      const service = await calculateServiceNameFromSlug(req.params.service as string);
      const serviceArea = await calculateServiceAreaFromSlug(service, req.params.serviceArea as string);
      const action = req.params.action as string;
      const results = await this.dataApiRequests.performPostcodeSearch(postcode, serviceArea.name, action);
      if (!Array.isArray(results) || (Array.isArray(results) && results.length === 0)) {
        return servicePostcodeSearchRedirect(res, req.params.service as string, serviceArea.slug, action, null, true);
      }
      return this.renderView(req, res, 'postcode-results', 'postcode-results', {
        results: {
          locations: results,
        },
        postcodeOnlySearch: false,
        serviceArea: this.localise(req, serviceArea.name, serviceArea.nameCy).toLowerCase(),
        postcode,
        isDivorceOrCivil: DIVORCE_OR_CIVIL_SERVICE_LIST.has(req.params.serviceArea as string),
        onlineText: this.localiseWithEnglishFallback(req, serviceArea.onlineText, serviceArea.onlineTextCy),
        onlineUrl: serviceArea.onlineUrl,
      });
    } catch {
      return this.renderNotFound(req, res);
    }
  }

  private async performPostcodeOnlySearch(req: FactRequest, res: Response, postcode: string) {
    const results = await this.dataApiRequests.performPostcodeOnlySearch(postcode);
    if (!Array.isArray(results) || (Array.isArray(results) && results.length === 0)) {
      return postcodeSearchRedirect(res, null, true);
    } else {
      return this.renderView(req, res, 'postcode-results', 'postcode-results', {
        results: {
          courts: results,
        },
        postcodeOnlySearch: true,
        postcode,
      });
    }
  }
}
