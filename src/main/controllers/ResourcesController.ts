import { GET, route } from 'awilix-express';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';
import { type DataApiErrorMapping, isDataApiError } from '../requests/DataApiError';
import { DataApiRequests } from '../requests/DataApiRequests';

import BaseController from './BaseController';

@route('/res')
export default class ResourcesController extends BaseController {
  constructor(private readonly dataApiRequests = new DataApiRequests()) {
    super();
  }

  @route('/img/:courtId')
  @GET()
  public async img(req: FactRequest, res: Response): Promise<void> {
    const courtId = this.getUuidRouteParam(req, 'courtId');

    if (!courtId) {
      res.sendStatus(400);
      return;
    }

    return this.serveFileStream(`/resources/v1/court-photo/${courtId}`, res, { notFound: true });
  }

  @route('/csv')
  @GET()
  public async csv(req: FactRequest, res: Response): Promise<void> {
    return this.serveFileStream('/resources/v1/csv', res, { notFound: true });
  }

  private async serveFileStream(url: string, res: Response, mapping?: DataApiErrorMapping): Promise<void> {
    const result = await this.dataApiRequests.getFileStream(url, mapping);

    if (isDataApiError(result)) {
      res.sendStatus(result.status);
      return;
    }

    if (result.headers.contentType) {
      res.setHeader('Content-Type', result.headers.contentType);
    }
    if (result.headers.contentDisposition) {
      res.setHeader('Content-Disposition', result.headers.contentDisposition);
    }
    if (result.headers.contentLength) {
      res.setHeader('Content-Length', result.headers.contentLength);
    }

    result.stream.on('error', () => {
      if (!res.headersSent) {
        res.sendStatus(502);
      } else {
        res.destroy();
      }
    });

    result.stream.pipe(res);
  }
}
