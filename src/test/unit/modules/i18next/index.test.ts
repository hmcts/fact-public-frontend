import express, { NextFunction, Response } from 'express';

const handle = jest.fn(() => (_req: unknown, _res: unknown, next: NextFunction) => next());

jest.mock('i18next-http-middleware', () => {
  class MockLanguageDetector {
    public static type = 'languageDetector';
    public type = 'languageDetector';
    public init(): void {}
    public detect(): string {
      return 'en';
    }
    public cacheUserLanguage(): void {}
  }

  return {
    LanguageDetector: MockLanguageDetector,
    handle,
  };
});

import { FactRequest } from '../../../../main/interfaces/FactRequest';
import { I18next } from '../../../../main/modules/i18next';

type Middleware = (req: FactRequest, res: Response, next: NextFunction) => void;

function getCustomMiddleware(appUseSpy: jest.SpyInstance): Middleware {
  // enableFor() registers:
  // 1) handle(i18next)
  // 2) custom locals middleware
  return appUseSpy.mock.calls[1][0] as Middleware;
}

function buildReq(partial: Partial<FactRequest> = {}): FactRequest {
  return {
    path: '/search-by-location',
    query: {},
    lng: 'en',
    i18n: {
      getDataByLanguage: jest.fn().mockReturnValue({
        template: { feedback: '<p>feedback</p>' },
      }),
    },
    ...partial,
  } as unknown as FactRequest;
}

function buildRes(): Response {
  return {
    locals: {},
  } as Response;
}

describe('I18next', () => {
  let appUseSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    appUseSpy = jest.spyOn(express.application, 'use');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('registers i18next handler and locals middleware', () => {
    const app = express();

    new I18next().enableFor(app);

    expect(appUseSpy).toHaveBeenCalledTimes(2);
    expect(handle).toHaveBeenCalledTimes(1);
  });

  test('sets htmlLang and Welsh language toggle when current language is English', () => {
    const app = express();
    new I18next().enableFor(app);

    const middleware = getCustomMiddleware(appUseSpy);
    const req = buildReq({
      lng: 'en',
      path: '/search-by-location',
      query: { search: 'cardiff', lng: 'en' },
    });
    const res = buildRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.locals.htmlLang).toBe('en');
    expect(res.locals.languageToggle).toContain('>Cymraeg<');
    expect(res.locals.languageToggle).toContain('href="/search-by-location?search=cardiff&amp;lng=cy"');
    expect(next).toHaveBeenCalled();
  });

  test('sets English language toggle when current language is Welsh', () => {
    const app = express();
    new I18next().enableFor(app);

    const middleware = getCustomMiddleware(appUseSpy);
    const req = buildReq({
      lng: 'cy',
      path: '/courts',
      query: { postcode: 'SW1A1AA', lng: 'cy' },
    });
    const res = buildRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.locals.htmlLang).toBe('cy');
    expect(res.locals.languageToggle).toContain('>English<');
    expect(res.locals.languageToggle).toContain('href="/courts?postcode=SW1A1AA&amp;lng=en"');
    expect(next).toHaveBeenCalled();
  });

  test('preserves allowed params and drops transient/sensitive params', () => {
    const app = express();
    new I18next().enableFor(app);

    const middleware = getCustomMiddleware(appUseSpy);
    const req = buildReq({
      lng: 'en',
      path: '/postcode-search',
      query: {
        postcode: 'SW1A1AA',
        error: 'invalid',
        noResults: 'true',
        token: 'secret',
        lng: 'en',
      },
    });
    const res = buildRes();
    const next = jest.fn();

    middleware(req, res, next);

    const html = String(res.locals.languageToggle);
    expect(html).toContain('postcode=SW1A1AA');
    expect(html).toContain('lng=cy');
    expect(html).not.toContain('error=');
    expect(html).not.toContain('noResults=');
    expect(html).not.toContain('token=');
    expect(next).toHaveBeenCalled();
  });

  test('supports array query values for allowed params', () => {
    const app = express();
    new I18next().enableFor(app);

    const middleware = getCustomMiddleware(appUseSpy);
    const req = buildReq({
      lng: 'en',
      path: '/courts/a-z',
      query: { prefix: ['A', 'B'], lng: 'en' },
    });
    const res = buildRes();
    const next = jest.fn();

    middleware(req, res, next);

    const html = String(res.locals.languageToggle);
    expect(html).toContain('prefix=A');
    expect(html).toContain('prefix=B');
    expect(html).toContain('lng=cy');
    expect(next).toHaveBeenCalled();
  });

  test('escapes href HTML context', () => {
    const app = express();
    new I18next().enableFor(app);

    const middleware = getCustomMiddleware(appUseSpy);
    const req = buildReq({
      lng: 'en',
      path: '/search-by-location',
      query: { search: 'a&b<c>"d\'e' },
    });
    const res = buildRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.locals.languageToggle).toContain('href="/search-by-location?search=a%26b%3Cc%3E%22d%27e&amp;lng=cy"');
    expect(next).toHaveBeenCalled();
  });
});
