const mockApp = {
  locals: { container: {} },
  get: jest.fn(),
  set: jest.fn(),
  use: jest.fn(),
};
const mockStaticMiddleware = jest.fn();
const mockExpress = Object.assign(
  jest.fn(() => mockApp),
  {
    static: jest.fn(
      (_root: string, _options: { setHeaders: (response: { setHeader: jest.Mock }, filePath: string) => void }) =>
        mockStaticMiddleware
    ),
  }
);
const mockLimiter = jest.fn();
const mockJsonParser = jest.fn();
const mockUrlencodedParser = jest.fn();
const mockSessionMiddleware = jest.fn();
const mockCookieMiddleware = jest.fn();
const mockScopeMiddleware = jest.fn();
const mockControllersMiddleware = jest.fn();
const mockEnablePropertiesVolume = jest.fn();
const mockEnableAppInsights = jest.fn();
const mockEnableNunjucks = jest.fn();
const mockEnableHelmet = jest.fn();
const mockEnableContainer = jest.fn();
const mockEnableI18next = jest.fn();
const mockSetupDev = jest.fn();
const mockLoggerError = jest.fn();

jest.mock('express', () => ({
  __esModule: true,
  default: mockExpress,
}));

jest.mock('express-rate-limit', () => ({
  __esModule: true,
  default: jest.fn(() => mockLimiter),
}));

jest.mock('body-parser', () => ({
  json: jest.fn(() => mockJsonParser),
  urlencoded: jest.fn(() => mockUrlencodedParser),
}));

jest.mock('express-session', () => ({
  __esModule: true,
  default: jest.fn(() => mockSessionMiddleware),
}));

jest.mock('cookie-parser', () => ({
  __esModule: true,
  default: jest.fn(() => mockCookieMiddleware),
}));

jest.mock('config', () => ({
  get: jest.fn((key: string) => {
    if (key === 'secrets.fact-kv.SESSION_SECRET') {
      return 'test-secret';
    }
    return {};
  }),
}));

jest.mock('awilix-express', () => ({
  scopePerRequest: jest.fn(() => mockScopeMiddleware),
  loadControllers: jest.fn(() => mockControllersMiddleware),
}));

jest.mock('../../main/development', () => ({ setupDev: mockSetupDev }));
jest.mock('../../main/modules/properties-volume', () => ({
  PropertiesVolume: jest.fn().mockImplementation(() => ({ enableFor: mockEnablePropertiesVolume })),
}));
jest.mock('../../main/modules/appinsights', () => ({
  AppInsights: jest.fn().mockImplementation(() => ({ enable: mockEnableAppInsights })),
}));
jest.mock('../../main/modules/nunjucks', () => ({
  Nunjucks: jest.fn().mockImplementation(() => ({ enableFor: mockEnableNunjucks })),
}));
jest.mock('../../main/modules/helmet', () => ({
  Helmet: jest.fn().mockImplementation(() => ({ enableFor: mockEnableHelmet })),
}));
jest.mock('../../main/modules/awilix', () => ({
  Container: jest.fn().mockImplementation(() => ({ enableFor: mockEnableContainer })),
}));
jest.mock('../../main/modules/i18next', () => ({
  I18next: jest.fn().mockImplementation(() => ({ enableFor: mockEnableI18next })),
}));
jest.mock('../../main/modules/logging', () => ({
  Logger: { getLogger: jest.fn(() => ({ error: mockLoggerError })) },
}));

import * as path from 'node:path';

import { app } from '../../main/app';

describe('app', () => {
  test('configures the application and middleware', () => {
    expect(app).toBe(mockApp);
    expect(app.locals.ENV).toBe('test');
    expect(mockEnablePropertiesVolume).toHaveBeenCalledWith(app);
    expect(mockEnableAppInsights).toHaveBeenCalled();
    expect(mockEnableNunjucks).toHaveBeenCalledWith(app);
    expect(mockEnableHelmet).toHaveBeenCalledWith(app);
    expect(mockEnableContainer).toHaveBeenCalledWith(app);
    expect(mockSetupDev).toHaveBeenCalledWith(app, false);
    expect(mockEnableI18next).toHaveBeenCalledWith(app);
    expect(mockApp.set).toHaveBeenCalledWith('trust proxy', 1);
    expect(mockApp.use).toHaveBeenCalledWith(mockScopeMiddleware);
    expect(mockApp.use).toHaveBeenCalledWith(mockControllersMiddleware);
  });

  test.each([
    ['main.12345678.js', 'public, max-age=31536000, immutable'],
    ['manifest.json', 'public, max-age=0, must-revalidate'],
  ])('sets the expected cache policy for %s', (fileName, expectedHeader) => {
    const staticOptions = mockExpress.static.mock.calls[0][1];
    const response = { setHeader: jest.fn() };

    staticOptions.setHeaders(response, path.join('/public', fileName));

    expect(response.setHeader).toHaveBeenCalledWith('Cache-Control', expectedHeader);
  });

  test('prevents dynamic responses from being cached', () => {
    const middleware = mockApp.use.mock.calls.map(call => call[0]).find(handler => handler?.length === 3);
    const response = { setHeader: jest.fn(), vary: jest.fn() };
    const next = jest.fn();

    middleware({}, response, next);

    expect(response.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(response.vary).toHaveBeenCalledWith('Cookie');
    expect(next).toHaveBeenCalled();
  });

  test('renders the translated not-found page', () => {
    const handler = mockApp.use.mock.calls.map(call => call[0]).find(candidate => candidate?.length === 2);
    const notFound = { heading: 'Page not found' };
    const request = {
      lng: 'en',
      i18n: { getDataByLanguage: jest.fn(() => ({ 'not-found': notFound })) },
    };
    const response = { status: jest.fn(), render: jest.fn() };

    handler(request, response);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.render).toHaveBeenCalledWith('not-found', notFound);
  });

  test('logs errors and renders the translated error page', () => {
    const handler = mockApp.use.mock.calls.map(call => call[0]).find(candidate => candidate?.length === 4);
    const error = Object.assign(new Error('Something went wrong'), { status: 503 });
    const errorContent = { heading: 'Sorry, there is a problem' };
    const request = {
      lng: 'en',
      i18n: { getDataByLanguage: jest.fn(() => ({ error: errorContent })) },
    };
    const response = { locals: {}, status: jest.fn(), render: jest.fn() };

    handler(error, request, response, jest.fn());

    expect(mockLoggerError).toHaveBeenCalledWith(error.stack);
    expect(response.locals).toEqual({ message: error.message, error: {} });
    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.render).toHaveBeenCalledWith('error', errorContent);
  });
});
