import { GET, POST, route } from 'awilix-express';
import { Response } from 'express';
import { cloneDeep } from 'lodash';

import { FactRequest } from '../interfaces/FactRequest';
import { DataApiRequests } from '../requests/DataApiRequests';
import { ServiceArea } from '../schemas/ServiceAreaSchema';
import { Service } from '../schemas/ServiceSchema';
import { isValidAction } from '../utils/validationUtils';

interface LocalisedServiceArea {
  id: string;
  text: string;
  description: string | null;
}

const dataApiRequests = new DataApiRequests();

@route('/services/:service/service-areas/:action')
export class ChooseServiceAreaController {
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

      // fail-fast to the not listed page.
      if (area === 'not-listed') {
        return res.redirect('/service-not-found');
      }

      if (!isValidAction(action)) {
        return res.status(404).render('not-found', req.i18n.getDataByLanguage(req.lng).notFound);
      }

      const serviceName = await this.calculateServiceName(service);
      const serviceArea = await this.calculateServiceArea(serviceName, area);
      if (!serviceArea) {
        return res.status(404).render('not-found', req.i18n.getDataByLanguage(req.lng).notFound);
      }

      // redirect to the appropriate search page (local or national)
      return this.redirectToSearch(service, serviceArea, action, res);
    } else {
      // set the error state to true and re-render the page
      await this.renderInternal(req, res, true);
    }
  }

  private async calculateServiceName(service: string): Promise<string | undefined> {
    let serviceName: string | undefined = undefined;
    const services = await dataApiRequests.getAllServices();
    if (Array.isArray(services)) {
      serviceName = services.find((s: Service) => s.slug === service)?.name;
    }
    return serviceName;
  }

  private async calculateServiceArea(serviceName: string | undefined, area: string): Promise<ServiceArea | undefined> {
    // determine the service area
    let serviceArea: ServiceArea | undefined = undefined;
    if (serviceName) {
      const result = await dataApiRequests.getServiceAreas(serviceName);
      if (Array.isArray(result)) {
        serviceArea = result.find(a => a.id === area);
      }
    }
    return serviceArea;
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
    const action = req.params.action as string;
    const service = req.params.service as string;
    const services = await dataApiRequests.getAllServices();

    if (!isValidAction(action)) {
      return res.status(404).render('not-found', req.i18n.getDataByLanguage(req.lng).notFound);
    }

    if (Array.isArray(services)) {
      const serviceInstance = services.find((s: Service) => s.slug === service);
      const serviceName = serviceInstance?.name;
      const serviceNameLocalised = req.lng === 'cy' ? serviceInstance?.nameCy : serviceInstance?.name;
      if (serviceName) {
        const result = await dataApiRequests.getServiceAreas(serviceName);
        if (Array.isArray(result) && result.length > 1) {
          return res.render('choose-service-area', {
            ...cloneDeep(req.i18n.getDataByLanguage(req.lng)['choose-service-area']),
            areas: this.localiseResult(result, req.lng),
            serviceNameLocalised,
            errors: err,
          });
        } else if (Array.isArray(result) && result.length === 1) {
          // if there's only one service area, skip the page and redirect to the appropriate search page
          return this.redirectToSearch(service, result[0], action, res);
        } else {
          res.redirect('/service-not-found');
        }
      }
    }
    return res.status(404).render('not-found', req.i18n.getDataByLanguage(req.lng).notFound);
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
