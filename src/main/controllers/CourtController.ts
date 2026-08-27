import { GET, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';
import { DataApiRequests } from '../requests/DataApiRequests';
import { Court } from '../schemas/courtSchema';
import { CourtService, CourtViewModel } from '../services/CourtService';

import BaseController from './BaseController';

type ClosedCourtLocale = Record<string, unknown> & {
  title?: string;
};

@route('/courts')
export default class CourtController extends BaseController {
  public constructor(
    private readonly dataApiRequests: DataApiRequests = new DataApiRequests(),
    private readonly courtService: CourtService = new CourtService()
  ) {
    super();
  }

  @route('/:slug' + '.json')
  @GET()
  public async getJson(req: FactRequest, res: Response): Promise<void> {
    const result = await this.dataApiRequests.getCourtDetails(req.params.slug as string);

    if (result === HttpStatusCode.NotFound) {
      return this.renderNotFound(req, res);
    }

    res.json(result);
  }

  @route('/:slug')
  @GET()
  public async get(req: FactRequest, res: Response): Promise<void> {
    const result = await this.dataApiRequests.getCourtDetails(req.params.slug as string);

    if (result === HttpStatusCode.NotFound) {
      return this.renderNotFound(req, res);
    }

    if (typeof result === 'number') {
      return this.renderError(req, res, result);
    }

    const court = result as Court;
    const viewModel: CourtViewModel = this.courtService.formatData(court, req.lng as string);

    if (!court.open) {
      const closed = this.getLocaleData<ClosedCourtLocale>(req, 'court-closed');
      return this.renderView(req, res, 'court-closed', 'court-closed', {
        title: closed.title?.replace('{name}', court.name),
        name: court.name,
      });
    }

    return this.renderView(req, res, 'court', 'court', {
      court: viewModel,
    });
  }
}
