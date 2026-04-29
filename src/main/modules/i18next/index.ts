import express, { NextFunction, Response } from 'express';
import i18next, { Resource, use } from 'i18next';
import { LanguageDetector, handle } from 'i18next-http-middleware';
import requireDir from 'require-directory';

import { FactRequest } from '../../interfaces/FactRequest';

const resources = requireDir(module, '../../', {
  include: /locales/,
}).locales as Resource;

export class I18next {
  constructor() {
    const options = {
      preload: ['en', 'cy'],
      resources,
      fallbackLng: 'en',
      supportedLngs: ['en', 'cy'],
      showSupportNotice: false,
      detection: {
        order: ['querystring', 'session', 'cookie'],
        caches: ['session', 'cookie'],
        lookupCookie: 'i18next',
        cookieName: 'i18next',
        setCookie: true,
        cookieSecure: true,
        cookieSameSite: (process.env.SESSION_COOKIE_SAME_SITE as 'strict' | 'lax' | 'none') || 'lax',
      },
    };

    use(LanguageDetector).init(options);
  }

  public enableFor(app: express.Express): void {
    app.use(handle(i18next));
    app.use(((req: FactRequest, res: Response, next: NextFunction) => {
      Object.assign(res.locals, req.i18n?.getDataByLanguage(req.lng)?.template);
      res.locals.htmlLang = req.lng;
      next();
    }) as express.RequestHandler);
  }
}
