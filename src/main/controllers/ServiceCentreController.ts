import { GET, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Response } from 'express';
import { cloneDeep } from 'lodash';

import { FactRequest } from '../interfaces/FactRequest';
import { DataApiRequests } from '../requests/DataApiRequests';
import { ServiceCentreDetails } from '../schemas/allLocationDetails';
import { ServiceCentreService } from '../services/ServiceCentreService';

const dataApiRequests = new DataApiRequests();
const serviceCentreService = new ServiceCentreService();

@route('/service-centres')
export default class ServiceCentreController {
  @route('/:slug')
  @GET()
  public async get(req: FactRequest, res: Response): Promise<void> {
    const result = await dataApiRequests.getServiceCentreDetails(req.params.slug as string);

    if (result === HttpStatusCode.NotFound) {
      return res.status(HttpStatusCode.NotFound).render('not-found', req.i18n.getDataByLanguage(req.lng)['not-found']);
    }

    if (typeof result === 'number') {
      return res.status(result).render('error', req.i18n.getDataByLanguage(req.lng).error);
    }

    const serviceCentre = result as ServiceCentreDetails;
    const translations = cloneDeep(req.i18n.getDataByLanguage(req.lng)['service-centre']);

    if (serviceCentre.open === false) {
      return res.render('court-closed', {
        ...translations.closed,
        title: translations.closed.title?.replace('{name}', serviceCentre.name),
        name: serviceCentre.name,
      });
    }

    return res.render('service-centre', {
      ...translations,
      serviceCentre: serviceCentreService.formatData(serviceCentre, req.lng as string),
    });
  }
}
