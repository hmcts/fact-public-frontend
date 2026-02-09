import { GET, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Response } from 'express';
import { cloneDeep } from 'lodash';

import { FactRequest } from '../interfaces/FactRequest';
import { DataApiRequests } from '../requests/DataApiRequests';
import { Court } from '../schemas/courtSchema';

const dataApiRequests = new DataApiRequests();

@route('/courts')
export default class CourtController {
  @route('/:slug')
  @GET()
  public async get(req: FactRequest, res: Response): Promise<void> {
    const result = await dataApiRequests.getCourtDetails(req.params.slug as string);
    console.log('The result:' + JSON.stringify(result));

    //TODO
    if (result === HttpStatusCode.NotFound) {
      return res.status(404).render('court-not-found', req.i18n.getDataByLanguage(req.lng)['court-not-found']);
    }

    const court = result as Court;

    //TODO
    if (!court.open) {
      return res.render('court-closed', req.i18n.getDataByLanguage(req.lng)['court-closed']);
    }

    //BUILDING!
    return res.render('court', {
      ...cloneDeep(req.i18n.getDataByLanguage(req.lng)['court']),
      court,
    });
  }
}
