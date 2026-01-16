import * as path from 'path';

import * as express from 'express';
import * as nunjucks from 'nunjucks';

export interface DynatraceOptions {
  env?: string;
  jstags: {
    prod: string;
    nonProd: string;
  };
}

export class Nunjucks {
  constructor(private readonly dynatrace: DynatraceOptions, public readonly developmentMode: boolean) {}

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

    env.addGlobal(
      'jstag',
      'prod' === this.dynatrace.env?.toLowerCase() ? this.dynatrace.jstags.prod : this.dynatrace.jstags.nonProd
    );

    app.use((req, res, next) => {
      res.locals.pagePath = req.path;
      next();
    });
  }
}
