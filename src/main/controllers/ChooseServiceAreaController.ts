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
    await this.renderInternal(req, res);
  }

  @POST()
  public async continue(req: FactRequest, res: Response): Promise<void> {
    if (req.body?.area) {
      const action = req.params.action as string;
      const service = req.params.service as string;
      const area = req.body.area as string;
      let serviceArea: ServiceArea | undefined = undefined;
      let serviceName: string | undefined = undefined;

      // determine the service name
      const services = req.session['services'] ?? (await dataApiRequests.getAllServices());
      if (Array.isArray(services)) {
        req.session['services'] = services;
        serviceName = services.find((s: Service) => s.slug === service)?.name;
      }

      // determine the service area
      if (serviceName) {
        const result = req.session[`service-areas-${serviceName}`] ??
          await dataApiRequests.getServiceAreas(serviceName);
        if (Array.isArray(result)) {
          req.session[`service-areas-${serviceName}`] = result;
          serviceArea = result.find(a => a.id === area);
        }
      } else {
        // treating everything as a not found
        return res.status(404).render('not-found', req.i18n.getDataByLanguage(req.lng).notFound);
      }

      // redirect to the appropriate search page (local or national)
      if (serviceArea) {
        return this.redirectToSearch(service, serviceArea, action, res);
      } else {
        // or show a not found if we don't have a service area
        return res.status(404).render('not-found', req.i18n.getDataByLanguage(req.lng).notFound);
      }
    } else {
      // set the error state to true and re-render the page
      await this.renderInternal(req, res, true);
    }
  }

  /**
   * Redirects to the appropriate search page based on the service area and action chosen.
   *
   * - If the user has chosen to search for the nearest service, but the chosen service area
   * doesn't have a local search, they will be redirected to the postcode search page.
   * - If the user has chosen to search nationally, but the chosen service area doesn't have
   * a national search, they will also be redirected to the postcode search page.
   * - In all other cases, the user will be redirected to the standard search results page.
   *
   * @param serviceName the service name
   * @param serviceArea the serviceArea object
   * @param action the action
   * @param res the Response
   * @private
   */
  private redirectToSearch(serviceName: string, serviceArea: ServiceArea, action: string, res: Response) {
    const redirectToResults = `/services/${serviceName}/${serviceArea.slug}/search-results`;
    const redirectToPostcodeSearch = `/services/${serviceName}/${serviceArea.slug}/${action}/search-by-postcode`;
    if (
      (action.toLowerCase() === 'nearest' && serviceArea.hasLocal) ||
      (action.toLowerCase() !== 'nearest' && !serviceArea.hasNational)
    ) {
      res.redirect(redirectToPostcodeSearch);
    } else {
      res.redirect(redirectToResults);
    }
  }

  /**
   * renders the page in the appropriate state based on the error flag.
   *
   * @param req the FactRequest
   * @param res the Response
   * @param err a boolean flag indicating whether to render the page in an error state
   * @private
   */
  private async renderInternal(req: FactRequest, res: Response, err: boolean = false): Promise<void> {
    const service = req.params.service as string;
    const services = req.session['services'] ?? (await dataApiRequests.getAllServices());
    if (Array.isArray(services)) {
      req.session['services'] = services;
      const serviceName = services.find((s: Service) => s.slug === service)?.name;
      const result = req.session[`service-areas-${serviceName}`] ??
        await dataApiRequests.getServiceAreas(serviceName);
      if (Array.isArray(result)) {
        req.session[`service-areas-${serviceName}`] = result;
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
