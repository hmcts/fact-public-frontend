import { GET, route } from 'awilix-express';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';
import { DataApiRequests } from '../requests/DataApiRequests';
import { ServiceArea } from '../schemas/ServiceAreaSchema';
import { calculateServiceAreaFromSlug, calculateServiceNameFromSlug } from '../utils/SchemaUtils';
import { checkPostcode, isValidPostcode } from '../utils/validationUtils';

const DIVORCE_OR_CIVIL_SERVICE_LIST = new Set(['divorce', 'civil-partnership']);

const dataApiRequests = new DataApiRequests();

@route('/services/:service/:serviceArea/:action/search-by-postcode/courts/near')
@route('/services/search-by-postcode/courts/near')
export default class PostcodeResultsController {
  @GET()
  public async get(req: FactRequest, res: Response): Promise<void> {
    const noServiceSearch: boolean = req.params?.service === undefined;
    if (isValidPostcode(req.query?.postcode as string)) {
      const postcode = req.query.postcode as string;
      // perform the search
      if (noServiceSearch) {
        return this.performPostcodeOnlySearch(req, res, postcode);
      } else {
        return this.performServiceAreaPostcodeSearch(req, res, postcode);
      }
    }
    // postcode is invalid, so redirect to the search page with error message
    if (noServiceSearch) {
      res.redirect(`/services/search-by-postcode?error=${checkPostcode(req.query?.postcode as string)}`);
    }
    res.redirect(
      `/services/${req.params.service}/${req.params.serviceArea}/${req.params.action}/search-by-postcode?error=${checkPostcode(req.query?.postcode as string)}`
    );
  }

  private async performServiceAreaPostcodeSearch(req: FactRequest, res: Response, postcode: string) {
    try {
      const service = await calculateServiceNameFromSlug(req.params.service as string);
      const serviceArea = await calculateServiceAreaFromSlug(service, req.params.serviceArea as string);
      const action = req.params.action as string;
      const results = await dataApiRequests.performPostcodeSearch(postcode, serviceArea.name, action);
      if (!Array.isArray(results) || results.length === 0) {
        return res.redirect(
          `/services/${req.params.service}/${req.params.serviceArea}/${req.params.action}/search-by-postcode?noResults=true`
        );
      } else {
        const data = {
          ...req.i18n.getDataByLanguage(req.lng)['postcode-results'],
          results: {
            courts: results,
          },
          postcodeOnlySearch: false,
          serviceArea: this.localiseServiceAreaName(serviceArea, req).toLowerCase(),
          postcode,
          isDivorceOrCivil: DIVORCE_OR_CIVIL_SERVICE_LIST.has(req.params.serviceArea as string),
          onlineText: serviceArea.onlineText,
          onlineUrl: serviceArea.onlineUrl,
        };
        return res.render('postcode-results', data);
      }
    } catch {
      return res.status(404).render('not-found', req.i18n.getDataByLanguage(req.lng)['not-found']);
    }
  }

  private async performPostcodeOnlySearch(req: FactRequest, res: Response, postcode: string) {
    const results = await dataApiRequests.performPostcodeOnlySearch(postcode);
    if (!Array.isArray(results) || results.length === 0) {
      return res.redirect(
        `/services/${req.params.service}/${req.params.serviceArea}/${req.params.action}/search-by-postcode?noResults=true`
      );
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
}
