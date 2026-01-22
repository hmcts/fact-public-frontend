import * as path from 'path';

import { Logger } from '@hmcts/nodejs-logging';
import { loadControllers, scopePerRequest } from 'awilix-express';
import * as bodyParser from 'body-parser';
import config = require('config');
import cookieParser from 'cookie-parser';
import express from 'express';
import RateLimit from 'express-rate-limit';

import { HTTPError } from './HttpError';
import { setupDev } from './development';
import { FactRequest } from './interfaces/FactRequest';
import { AppInsights } from './modules/appinsights';
import { Container } from './modules/awilix';
import { Helmet } from './modules/helmet';
import { I18next } from './modules/i18next';
import { Nunjucks } from './modules/nunjucks';
import { PropertiesVolume } from './modules/properties-volume';

const env = process.env.NODE_ENV || 'development';
const developmentMode = env === 'development';

const limiter = RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per windowMs
});

export const app = express();
app.locals.ENV = env;

const logger = Logger.getLogger('app');

new PropertiesVolume().enableFor(app);
new AppInsights().enable();
new I18next().enableFor(app);
new Nunjucks(developmentMode).enableFor(app);
// secure the application by adding various HTTP headers to its responses
new Helmet(config.get('security'), developmentMode).enableFor(app);
new Container().enableFor(app);

app.use(scopePerRequest(app.locals.container));
app.use(loadControllers('controllers/**/*.+(ts|js)', { cwd: __dirname }));

app.get('/favicon.ico', limiter, (req, res) => {
  res.sendFile(path.join(__dirname, '/public/assets/rebrand/images/favicon.ico'));
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate, no-store');
  next();
});

setupDev(app, developmentMode);
// returning "not found" for requests with paths not resolved by the router
app.use((req: express.Request, res: express.Response) => {
  const factReq = req as FactRequest;
  res.status(404);
  const data = factReq.i18n?.getDataByLanguage(factReq.lng)?.notFound;
  res.render('not-found', data ?? {});
});

// error handler
app.use((err: HTTPError, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const factReq = req as FactRequest;
  logger.error(`${err.stack || err}`);

  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = env === 'development' ? err : {};
  res.status(err.status || 500);
  const data = factReq.i18n.getDataByLanguage(factReq.lng)?.error;
  res.render('error', data);
});
