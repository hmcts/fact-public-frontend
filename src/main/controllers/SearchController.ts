import { GET, route } from 'awilix-express';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';
import { DataApiRequests } from '../requests/DataApiRequests';

import BaseController from './BaseController';

@route('/search')
export default class SearchController extends BaseController {
  public constructor(private readonly dataApiRequests: DataApiRequests = new DataApiRequests()) {
    super();
  }

  @route('/results.json')
  @GET()
  public async getAllJson(req: FactRequest, res: Response): Promise<void> {
    const result = await this.dataApiRequests.getAll();
    res.json(result);
  }
}
