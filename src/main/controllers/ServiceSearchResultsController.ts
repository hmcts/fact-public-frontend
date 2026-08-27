import { GET, route } from 'awilix-express';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';
import { DataApiRequests } from '../requests/DataApiRequests';
import { CATCHMENT_TYPES } from '../schemas/courtServiceAreas';
import { calculateServiceAreaFromSlug, calculateServiceNameFromSlug } from '../utils/SchemaUtils';

import BaseController from './BaseController';

@route('/services/:service/:serviceArea/search-results')
export default class ServiceSearchResultsController extends BaseController {
  public constructor(private readonly dataApiRequests: DataApiRequests = new DataApiRequests()) {
    super();
  }

  @GET()
  public async render(req: FactRequest, res: Response): Promise<void> {
    try {
      const service = await calculateServiceNameFromSlug(req.params.service as string);
      const serviceArea = await calculateServiceAreaFromSlug(service, req.params.serviceArea as string);
      const results = await this.dataApiRequests.getServiceAreaSearchResults(serviceArea.name);
      const localeData = this.getLocaleData<{ hint: string }>(req, 'service-results');
      const data = {
        results: {},
        hint:
          this.localise(req, serviceArea.text, serviceArea.textCy) ??
          localeData.hint.replace(
            '{serviceArea}',
            this.localise(req, serviceArea.name, serviceArea.nameCy).toLowerCase()
          ),
        onlineText: this.localiseWithEnglishFallback(req, serviceArea.onlineText, serviceArea.onlineTextCy),
        onlineUrl: serviceArea.onlineUrl,
      };

      if (Array.isArray(results)) {
        for (const serviceCentre of results) {
          if (serviceCentre.catchmentType === CATCHMENT_TYPES.NATIONAL) {
            data.results = serviceCentre;
            break;
          }
        }
      }

      return this.renderView(req, res, 'service-results', 'service-results', data);
    } catch {
      return this.renderNotFound(req, res);
    }
  }
}
