import express, { NextFunction, Response } from 'express';
import i18next, { Resource, use } from 'i18next';
import { LanguageDetector, handle } from 'i18next-http-middleware';
import requireDir from 'require-directory';

import { FactRequest } from '../../interfaces/FactRequest';
import { SupportedLanguage, buildLanguageSwitchUrl } from '../../utils/languageSwitchUrl';

const resources = requireDir(module, '../../', {
  include: /locales/,
}).locales as Resource;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export class I18next {
  constructor() {
    const options = {
      preload: ['en', 'cy'],
      resources,
      fallbackLng: 'en',
      supportedLngs: ['en', 'cy'],
      showSupportNotice: false,
      detection: {
        order: ['querystring', 'cookie'],
        caches: ['cookie'],
      },
    };

    use(LanguageDetector).init(options);
  }

  public enableFor(app: express.Express): void {
    app.use(handle(i18next));
    app.use(((req: FactRequest, res: Response, next: NextFunction) => {
      Object.assign(res.locals, req.i18n?.getDataByLanguage(req.lng)?.template);
      res.locals.htmlLang = req.lng;

      const currentLanguage = req.lng === 'cy' ? 'cy' : 'en';
      const targetLanguage: SupportedLanguage = currentLanguage === 'cy' ? 'en' : 'cy';
      const toggleText = targetLanguage === 'cy' ? 'Cymraeg' : 'English';

      const query = new URLSearchParams();
      for (const [key, rawValue] of Object.entries(req.query ?? {})) {
        if (Array.isArray(rawValue)) {
          for (const item of rawValue) {
            if (typeof item === 'string') {
              query.append(key, item);
            }
          }
        } else if (typeof rawValue === 'string') {
          query.append(key, rawValue);
        }
      }

      const href = buildLanguageSwitchUrl(req.path, query, targetLanguage);
      res.locals.languageToggle = `<a href="${escapeHtml(href)}" class="govuk-link fact-language">${toggleText}</a>`;

      next();
    }) as express.RequestHandler);
  }
}
