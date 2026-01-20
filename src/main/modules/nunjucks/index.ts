import * as path from 'path';

import { Logger } from '@hmcts/nodejs-logging';
import * as express from 'express';
import * as nunjucks from 'nunjucks';

export interface DynatraceOptions {
  jstagKey: string;
  jstags: {
    [index: string]: string;
  };
}

const logger = Logger.getLogger('nunjucks');

export class Nunjucks {
  private readonly jstag: string;
  constructor(
    dynatrace: DynatraceOptions,
    public readonly developmentMode: boolean
  ) {
    this.jstag = dynatrace?.jstags[dynatrace.jstagKey] ?? null;
    if (this.jstag === null) {
      throw new Error('Dynatrace jstag not found');
    }
  }

  enableFor(app: express.Express): void {
    app.set('view engine', 'njk');
    const govukTemplates = path.dirname(require.resolve('govuk-frontend/package.json')) + '/dist';
    const viewsPath = path.join(__dirname, '..', '..', 'views');

    const env = nunjucks.configure([govukTemplates, viewsPath], {
      autoescape: true,
      watch: this.developmentMode,
      express: app,
    });
    env.addGlobal('govukRebrand', true);
    logger.info(`using jstag: ${this.jstag}`);
    env.addGlobal('jstag', this.jstag);

    app.use((req, res, next) => {
      res.locals.pagePath = req.path;
      next();
    });
  }
}
