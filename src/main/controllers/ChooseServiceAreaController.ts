import { GET, POST, route } from 'awilix-express';
import { Response } from 'express';
import { cloneDeep } from 'lodash';

import { FactRequest } from '../interfaces/FactRequest';
import { DataApiRequests } from '../requests/DataApiRequests';
import { ServiceArea } from '../schemas/ServiceAreaSchema';
import { Service } from '../schemas/ServiceSchema';

interface LocalisedServiceArea {
  id: string;
  text: string;
  description: string | null;
}

const dataApiRequests = new DataApiRequests();

@route('/services/:service/service-areas/:action')
export class ChooseServiceController {
  @GET()
  public async render(req: FactRequest, res: Response): Promise<void> {
    this.renderInternal(req, res);
  }

  @POST()
  public async continue(req: FactRequest, res: Response): Promise<void> {
    if (req.body?.area) {
      const action = req.params.action as string;
      const service = req.params.service as string;
      const area = req.body.area as string;

      if (action.toLowerCase() === 'nearest') {

      }
    } else {
      await this.renderInternal(req, res, true);
    }
  }

  private async renderInternal(req: FactRequest, res: Response, err: boolean = false): Promise<void> {
    const service = req.params.service as string;
    const services = req.session['services'] ?? (await dataApiRequests.getAllServices());
    if (Array.isArray(services)) {
      req.session['services'] = services;
      const serviceName = services.find((s: Service) => s.slug === service).name;
      const result = await dataApiRequests.getServiceAreas(serviceName);
      if (Array.isArray(result)) {
        res.render('choose-service-area', {
          ...cloneDeep(req.i18n.getDataByLanguage(req.lng)['choose-service-area']),
          areas: this.localiseResult(result, req.lng),
          serviceName,
          errors: err,
        });
      }
    }
  }

  /**
   * Applies the currently selected language to the retrieved service area list, normalising on
   * Welsh if the language code is "cy", and English in all other cases.
   *
   * @param areas the retrieved Service Area array
   * @param lng the language associated with the request, if any
   * @private
   */
  private localiseResult(areas: ServiceArea[], lng: string | undefined): LocalisedServiceArea[] {
    const result: LocalisedServiceArea[] = [];
    for (const area of areas) {
      result.push({
        id: area.id,
        text: lng === 'cy' ? area.nameCy : area.name,
        description: lng === 'cy' ? area.descriptionCy : area.description,
      });
    }
    return result;
  }
}
