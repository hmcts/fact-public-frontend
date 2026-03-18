import { GET, POST, route } from 'awilix-express';
import { Response } from 'express';
import { cloneDeep } from 'lodash';

import { FactRequest } from '../interfaces/FactRequest';
import { DataApiRequests } from '../requests/DataApiRequests';
import { Service } from '../schemas/ServiceSchema';

interface LocalisedService {
  id: string;
  text: string;
  description: string | null;
  value: string | null;
}

const dataApiRequests = new DataApiRequests();

@route('/services/:action')
export class ChooseServiceController {
  @GET()
  public async render(req: FactRequest, res: Response): Promise<void> {
    await this.renderInternal(req, res);
  }

  @POST()
  public async continue(req: FactRequest, res: Response): Promise<void> {
    if (req.body?.service) {
      const action = req.params.action as string;
      const service = req.body.service as string;
      res.redirect('/services/' + service + '/service-areas/' + action);
    } else {
      await this.renderInternal(req, res, true);
    }
  }

  private async renderInternal(req: FactRequest, res: Response, err: boolean = false): Promise<void> {
    const result = req.session['services'] ?? (await dataApiRequests.getAllServices());
    if (Array.isArray(result)) {
      req.session['services'] = result;
      res.render('choose-service', {
        ...cloneDeep(req.i18n.getDataByLanguage(req.lng)['choose-service']),
        services: this.localiseResult(result, req.lng),
        errors: err
      });
    }
  }

  /**
   * Applies the currently selected language to the retrieved service list, normalising on
   * Welsh if the language code is "cy", and English in all other cases.
   *
   * @param services the retrieved Service array
   * @param lng the language associated with the request, if any
   * @private
   */
  private localiseResult(services: Service[], lng: string | undefined): LocalisedService[] {
    const result: LocalisedService[] = [];
    for (const service of services) {
      result.push({
        id: service.id,
        text: lng === 'cy' ? service.nameCy : service.name,
        description: lng === 'cy' ? service.descriptionCy : service.description,
        value: service.slug,
      });
    }
    return result;
  }
}
