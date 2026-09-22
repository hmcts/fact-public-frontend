import { GET, route } from 'awilix-express';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';
import { isDataApiError } from '../requests/DataApiError';
import { DataApiRequests } from '../requests/DataApiRequests';
import { ServiceCentreDetails } from '../schemas/allLocationDetails';
import { ServiceCentreService } from '../services/ServiceCentreService';

import BaseController from './BaseController';

type ClosedServiceCentreLocale = Record<string, unknown> & {
  title?: string;
};

@route('/service-centres')
export default class ServiceCentreController extends BaseController {
  public constructor(
    private readonly dataApiRequests: DataApiRequests = new DataApiRequests(),
    private readonly serviceCentreService: ServiceCentreService = new ServiceCentreService()
  ) {
    super();
  }

  @route('/:slug')
  @GET()
  public async get(req: FactRequest, res: Response): Promise<void> {
    const result = await this.dataApiRequests.getServiceCentreDetails(req.params.slug as string);

    if (isDataApiError(result)) {
      return this.renderDataApiError(req, res, result);
    }

    const serviceCentre = result as ServiceCentreDetails;

    if (serviceCentre.open === false) {
      const closed = this.getLocaleData<ClosedServiceCentreLocale>(req, 'service-centre.closed');
      return this.renderView(req, res, 'court-closed', 'service-centre.closed', {
        title: closed.title?.replace('{name}', serviceCentre.name),
        name: serviceCentre.name,
      });
    }

    return this.renderView(req, res, 'service-centre', 'service-centre', {
      serviceCentre: this.serviceCentreService.formatData(serviceCentre, req.lng as string),
    });
  }
}
