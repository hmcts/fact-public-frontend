import { GET, POST, route } from 'awilix-express';
import { Response } from 'express';
import { cloneDeep } from 'lodash';

import { FactRequest } from '../interfaces/FactRequest';
import { DataApiRequests } from '../requests/DataApiRequests';
import { ServiceArea } from '../schemas/ServiceAreaSchema';
import { Service } from '../schemas/ServiceSchema';
import { calculateServiceAreaFromSlug, calculateServiceNameFromSlug } from '../utils/SchemaUtils';
import { isValidAction } from '../utils/validationUtils';

interface LocalisedServiceArea {
  id: string;
  text: string;
  description: string | null;
  value: string;
}

const dataApiRequests = new DataApiRequests();

@route('/services/:service/service-areas/:action')
export class ChooseServiceAreaController {
  @GET()
  public async render(req: FactRequest, res: Response): Promise<void> {
    await this.renderChooseServiceAreaPage(req, res);
  }

  @POST()
  public async continue(req: FactRequest, res: Response): Promise<void> {
    if (req.body?.area) {
      const action = req.params.action as string;
      const service = req.params.service as string;
      const area = req.body.area as string;

      // redirect back to the service selection page
      if (area === 'not-listed') {
        return res.redirect(`/services/${action}`);
      }

      if (!isValidAction(action)) {
        return res.status(404).render('not-found', req.i18n.getDataByLanguage(req.lng)['not-found']);
      }

      try {
        const serviceName = await calculateServiceNameFromSlug(service);
        const serviceArea = await calculateServiceAreaFromSlug(serviceName, area);
        // redirect to the appropriate search page (local or national)
        return this.redirectToSearch(service, serviceArea, action, res);
      } catch {
        return res.status(404).render('not-found', req.i18n.getDataByLanguage(req.lng)['not-found']);
      }
    } else {
      // set the error state to true and re-render the page
      await this.renderChooseServiceAreaPage(req, res, true);
    }
  }

  /**
   * Redirects to the appropriate search page based on the service area and action chosen.
   *
   * The logic is as follows:
   * - If there are no associations, redirect to the postcode search page.
   * - If the action is "nearest" and there are local or regional associations, redirect to the
   *   postcode search page. Otherwise, redirect to the national search page.
   * - If the action is "documents" and there are national but no regional associations, redirect
   *   to the national search page. Otherwise, redirect to the postcode search page.
   * - For all other actions, if there are national associations, redirect to the national search
   *   page. Otherwise, redirect to the postcode search page.
   *
   * @param serviceName the service name
   * @param serviceArea the serviceArea object
   * @param action the action
   * @param res the Response
   * @private
   */
  private redirectToSearch(serviceName: string, serviceArea: ServiceArea, action: string, res: Response) {
    const postcode = () => res.redirect(`/services/${serviceName}/${serviceArea.slug}/${action}/search-by-postcode`);
    const service = () => res.redirect(`/services/${serviceName}/${serviceArea.slug}/search-results`);
    // no associations then just skip to the postcode screen
    if (!serviceArea.hasLocal && !serviceArea.hasNational && !serviceArea.hasRegional) {
      return postcode();
    }
    switch (action.toLowerCase()) {
      case 'nearest':
        if (serviceArea.hasLocal || serviceArea.hasRegional) {
          return postcode();
        }
        return service();
      case 'documents':
        if (!serviceArea.hasRegional && serviceArea.hasNational) {
          return service();
        }
        return postcode();
      default:
        if (serviceArea.hasNational) {
          return service();
        }
        return postcode();
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
  private async renderChooseServiceAreaPage(req: FactRequest, res: Response, err: boolean = false): Promise<void> {
    const action = req.params.action as string;
    const service = req.params.service as string;
    const services = await dataApiRequests.getAllServices();

    if (!isValidAction(action)) {
      return res.status(404).render('not-found', req.i18n.getDataByLanguage(req.lng)['not-found']);
    }

    if (Array.isArray(services)) {
      // Find the service instance by slug, get its name and localised name.
      // If the service exists, fetch its service areas.
      // - If there are multiple areas, render the choose-service-area page with localised data.
      // - If there is only one area, redirect to the appropriate search page.
      // - If no areas are found, redirect to the service-not-found page.
      // If the service is not found, render the not-found page.

      const serviceInstance = services.find((s: Service) => s.slug === service);
      const serviceName = serviceInstance?.name;
      // Localise the service name here, to prevent the template from
      // having to include logic to determine which name to use.
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
          return this.redirectToSearch(service, result[0], action, res);
        } else {
          res.redirect('/service-not-found');
        }
      }
    }
    return res.status(404).render('not-found', req.i18n.getDataByLanguage(req.lng)['not-found']);
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
        value: area.slug,
      });
    }
    return result;
  }
}
