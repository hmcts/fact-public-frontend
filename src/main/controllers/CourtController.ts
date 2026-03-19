import { GET, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Response } from 'express';
import { cloneDeep } from 'lodash';

import { FactRequest } from '../interfaces/FactRequest';
import { DataApiRequests } from '../requests/DataApiRequests';
import { Court } from '../schemas/courtSchema';
import { CourtService, CourtViewModel } from '../services/CourtService';

const dataApiRequests = new DataApiRequests();
const courtService = new CourtService();

@route('/courts')
export default class CourtController {
  @route('/:slug')
  @GET()
  public async get(req: FactRequest, res: Response): Promise<void> {
    const result = await dataApiRequests.getCourtDetails(req.params.slug as string);

    if (result === HttpStatusCode.NotFound) {
      return res.status(404).render('not-found', req.i18n.getDataByLanguage(req.lng)['not-found']);
    }

    const court = result as Court;
    const viewModel: CourtViewModel = courtService.formatData(court, req.lng as string);

    if (!court.open) {
      const closed = cloneDeep(req.i18n.getDataByLanguage(req.lng)['court-closed']);
      return res.render('court-closed', {
        ...closed,
        title: closed.title?.replace('{name}', court.name),
        name: court.name,
      });
    }

    return res.render('court', {
      ...cloneDeep(req.i18n.getDataByLanguage(req.lng)['court']),
      court: viewModel,
    });
  }

  @route('/:slug' + '.json')
  @GET()
  public async getJson(req: FactRequest, res: Response): Promise<void> {
    const result = await dataApiRequests.getCourtDetails(req.params.slug as string);

    if (result === HttpStatusCode.NotFound) {
      return res.status(404).render('not-found', req.i18n.getDataByLanguage(req.lng)['not-found']);
    }

    res.json(result);
  }
}
