import express, { NextFunction, Response } from 'express';
import i18next, { Resource, use } from 'i18next';
import { LanguageDetector, handle } from 'i18next-http-middleware';
import requireDir from 'require-directory';

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
      detection: {
        order: ['querystring', 'cookie'],
        caches: ['cookie'],
      },
    };

    use(LanguageDetector)
      .init(options);
  }

  public enableFor(app: express.Express): void {
    app.use(handle(i18next));
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    app.use((req: any, res: Response, next: NextFunction) => {
      Object.assign(res.locals, req.i18n.getDataByLanguage(req.lng)?.template);
      next();
    });
  }
}
