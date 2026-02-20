import { GET, route } from 'awilix-express';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';
import { DataApiRequests } from '../requests/DataApiRequests';

const dataApiRequests = new DataApiRequests();

@route('/search')
export default class SearchController {
  @route('/results.json')
  @GET()
  public async getAllJson(req: FactRequest, res: Response): Promise<void> {
    const result = await dataApiRequests.getAll();
    res.json(result);
  }
}
