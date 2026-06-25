import { GET, route } from 'awilix-express';
import { Response } from 'express';
import { cloneDeep } from 'lodash';

import { FactRequest } from '../interfaces/FactRequest';
import { DataApiRequests } from '../requests/DataApiRequests';
import { ServiceArea } from '../schemas/ServiceAreaSchema';
import { CATCHMENT_TYPES } from '../schemas/courtServiceAreas';
import { calculateServiceAreaFromSlug, calculateServiceNameFromSlug } from '../utils/SchemaUtils';

const dataApiRequests = new DataApiRequests();

@route('/services/:service/:serviceArea/search-results')
export default class ServiceSearchResultsController {
  @GET()
  public async render(req: FactRequest, res: Response): Promise<void> {
    try {
      const service = await calculateServiceNameFromSlug(req.params.service as string);
      const serviceArea = await calculateServiceAreaFromSlug(service, req.params.serviceArea as string);
      const results = await dataApiRequests.getServiceAreaSearchResults(serviceArea.name);
      const data = {
        ...cloneDeep(req.i18n.getDataByLanguage(req.lng)['service-results']),
        results: {},
        onlineText: this.localiseOnlineText(serviceArea, req),
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

      if (req.lng === 'cy') {
        data.hint = serviceArea.textCy ?? data.hint.replace('{serviceArea}', serviceArea.nameCy.toLowerCase());
      } else {
        data.hint = serviceArea.text ?? data.hint.replace('{serviceArea}', serviceArea.name.toLowerCase());
      }

      return res.render('service-results', data);
    } catch {
      return res.status(404).render('not-found', req.i18n.getDataByLanguage(req.lng)['not-found']);
    }
  }

  private localiseOnlineText(serviceArea: ServiceArea, req: FactRequest): string | null {
    return req.lng === 'cy' && serviceArea.onlineTextCy ? serviceArea.onlineTextCy : serviceArea.onlineText;
  }
}
