import { GET, route } from 'awilix-express';
import { HttpStatusCode, create } from 'axios';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';

import BaseController from './BaseController';

export const oldFrontendUrl = process.env.OLD_FRONTEND_URL || 'http://localhost:3100';

export const oldFrontendProxy = create({
  baseURL: oldFrontendUrl,
  timeout: 20000,
  maxRedirects: 0,
  responseType: 'arraybuffer',
  validateStatus: () => true,
});

@route('/v2/proxy')
export default class ProxyController extends BaseController {
  @route('/search/slug/:slug')
  @route('/search/court-types/:courtTypes')
  @route('/search/postcode/:postcode/serviceArea/:serviceArea')
  @GET()
  public async render(req: FactRequest, res: Response): Promise<void> {
    try {
      // Keep the original encoding and query string for the legacy proxy to interpret.
      const response = await oldFrontendProxy.request({ url: req.originalUrl, method: req.method });

      for (const header of ['content-type', 'content-language', 'location', 'retry-after']) {
        const value = response.headers[header];
        if (value !== undefined) {
          res.setHeader(header, value);
        }
      }
      res.status(response.status).send(response.data);
    } catch {
      res.sendStatus(HttpStatusCode.BadGateway);
    }
  }
}
