import { GET, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';
import { DataApiRequests } from '../requests/DataApiRequests';

@route('/courts')
export default class CourtController {
  constructor(private readonly dataApiRequests: DataApiRequests) {}

  @route('/slug/:slug.json')
  @GET()
  public async getCourtDetailsJson(req: FactRequest, res: Response): Promise<void> {
    const result = await this.dataApiRequests.getCourtDetails(req.params.slug as string);

    if (result.results === HttpStatusCode.NotFound) {
      return res.status(404).render('not-found', req.i18n.getDataByLanguage(req.lng)['not-found']);
    }

    res.json(result);
  }

  @route('/all.json')
  @GET()
  public async getAllCourtDetailsJson(req: FactRequest, res: Response): Promise<void> {
    const result = await this.dataApiRequests.getAllCourtDetails();

    res.json(result);
  }
}
