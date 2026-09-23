jest.mock('@hmcts/cookie-manager', () => {
  const on = jest.fn();
  const init = jest.fn();
  return { __esModule: true, default: { on, init } };
});

type CookieManagerMock = {
  on: jest.Mock;
  init: jest.Mock;
};

type Preferences = { analytics: string; apm: string };
type EventHandler = (preferences: Preferences) => void;
type InsertedScript = { async?: boolean; src?: string; crossOrigin?: string; onload?: () => void };

const setupModule = (): CookieManagerMock => {
  jest.resetModules();
  const cookieManagerModule = require('@hmcts/cookie-manager') as { default: CookieManagerMock };
  require('../../../main/bundles/cookie-preferences');
  return cookieManagerModule.default;
};

const getHandler = (manager: CookieManagerMock, eventName: string): EventHandler => {
  const handlerCall = manager.on.mock.calls.find(([name]) => name === eventName);
  if (!handlerCall) {
    throw new Error(`Missing handler for ${eventName}`);
  }
  return handlerCall[1] as EventHandler;
};

const setupBrowser = () => {
  const dataLayer: unknown[] = [];
  const insertedScripts: InsertedScript[] = [];
  const gtag = jest.fn((...args: unknown[]) => dataLayer.push(args));
  const dtrum = {
    enable: jest.fn(),
    enableSessionReplay: jest.fn(),
    disable: jest.fn(),
    disableSessionReplay: jest.fn(),
  };
  const appendChild = jest.fn((script: InsertedScript) => insertedScripts.push(script));
  const querySelector = jest.fn().mockReturnValue({ getAttribute: () => '/jstag.js' });

  (global as { window: unknown }).window = { dataLayer, gtag, dtrum };
  (global as { document: unknown }).document = {
    createElement: jest.fn().mockImplementation(() => ({})),
    querySelector,
    head: { appendChild },
  };

  return { dataLayer, insertedScripts, gtag, dtrum, appendChild, querySelector };
};

describe('cookie-preferences bundle', () => {
  afterEach(() => {
    delete (global as { document?: unknown }).document;
    delete (global as { window?: unknown }).window;
  });

  test('initializes the cookie manager with secure preferences and the existing manifest', () => {
    const manager = setupModule();

    expect(manager.init).toHaveBeenCalledWith(
      expect.objectContaining({
        userPreferences: { cookieName: 'fact-cookie-preferences', cookieSecure: true },
        cookieManifest: expect.arrayContaining([
          expect.objectContaining({ categoryName: 'essential', optional: false }),
          expect.objectContaining({ categoryName: 'analytics' }),
          expect.objectContaining({ categoryName: 'apm' }),
        ]),
      })
    );
    expect(manager.on.mock.calls.map(([event]) => event)).toEqual(
      expect.arrayContaining(['PreferenceFormSubmitted', 'UserPreferencesLoaded', 'UserPreferencesSaved'])
    );
  });

  test('PreferenceFormSubmitted shows the confirmation and scrolls to top', () => {
    const manager = setupModule();
    const handler = getHandler(manager, 'PreferenceFormSubmitted');
    const message = { style: { display: 'none' }, focus: jest.fn() };

    (global as { document: unknown }).document = {
      querySelector: jest.fn().mockReturnValue(message),
      body: { scrollTop: 100 },
      documentElement: { scrollTop: 200 },
    };

    handler({ analytics: 'off', apm: 'off' });

    expect(message.style.display).toBe('block');
    expect(message.focus).toHaveBeenCalled();
    expect((global as { document: { body: { scrollTop: number } } }).document.body.scrollTop).toBe(0);
    expect(
      (global as { document: { documentElement: { scrollTop: number } } }).document.documentElement.scrollTop
    ).toBe(0);
  });

  test.each(['UserPreferencesLoaded', 'UserPreferencesSaved'])(
    '%s leaves both vendors unloaded when consent is denied',
    eventName => {
      const browser = setupBrowser();
      const handler = getHandler(setupModule(), eventName);
      const preferences = { analytics: 'off', apm: 'off' };

      handler(preferences);

      expect(browser.gtag).toHaveBeenCalledWith('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });
      expect(browser.dataLayer[1]).toEqual({ event: 'Cookie Preferences', cookiePreferences: preferences });
      expect(browser.insertedScripts).toHaveLength(0);
      expect(browser.dtrum.disable).toHaveBeenCalled();
      expect(browser.dtrum.disableSessionReplay).toHaveBeenCalled();
    }
  );

  test.each(['UserPreferencesLoaded', 'UserPreferencesSaved'])(
    '%s loads GTM after the analytics consent update',
    eventName => {
      const browser = setupBrowser();
      const handler = getHandler(setupModule(), eventName);

      handler({ analytics: 'on', apm: 'off' });

      expect(browser.dataLayer[0]).toEqual([
        'consent',
        'update',
        {
          analytics_storage: 'granted',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
        },
      ]);
      expect(browser.dataLayer[2]).toEqual(expect.objectContaining({ event: 'gtm.js' }));
      expect(browser.insertedScripts).toEqual([
        expect.objectContaining({
          async: true,
          src: 'https://www.googletagmanager.com/gtm.js?id=GTM-N7NMJDR',
        }),
      ]);
      expect(browser.dtrum.disable).toHaveBeenCalled();
    }
  );

  test.each(['UserPreferencesLoaded', 'UserPreferencesSaved'])(
    '%s loads Dynatrace only for APM consent and enables it after loading',
    eventName => {
      const browser = setupBrowser();
      const handler = getHandler(setupModule(), eventName);

      handler({ analytics: 'off', apm: 'on' });

      expect(browser.insertedScripts).toEqual([
        expect.objectContaining({ src: '/jstag.js', crossOrigin: 'anonymous' }),
      ]);
      expect(browser.querySelector).toHaveBeenCalledWith('meta[name="dynatrace-jstag"]');
      browser.insertedScripts[0].onload?.();
      expect(browser.dtrum.enable).toHaveBeenCalled();
      expect(browser.dtrum.enableSessionReplay).toHaveBeenCalled();
    }
  );

  test('consent changes update loaded vendors without inserting duplicates', () => {
    const browser = setupBrowser();
    const manager = setupModule();
    const loaded = getHandler(manager, 'UserPreferencesLoaded');
    const saved = getHandler(manager, 'UserPreferencesSaved');

    loaded({ analytics: 'on', apm: 'on' });
    expect(browser.insertedScripts).toHaveLength(2);
    browser.insertedScripts[0].onload?.();
    saved({ analytics: 'on', apm: 'on' });
    expect(browser.insertedScripts).toHaveLength(2);

    saved({ analytics: 'off', apm: 'off' });
    expect(browser.gtag).toHaveBeenLastCalledWith(
      'consent',
      'update',
      expect.objectContaining({ analytics_storage: 'denied' })
    );
    expect(browser.dtrum.disable).toHaveBeenCalled();
    expect(browser.dtrum.disableSessionReplay).toHaveBeenCalled();

    browser.dtrum.enable.mockClear();
    browser.insertedScripts[1].onload?.();
    expect(browser.dtrum.enable).not.toHaveBeenCalled();

    saved({ analytics: 'on', apm: 'on' });
    expect(browser.insertedScripts).toHaveLength(2);
    expect(browser.dtrum.enable).toHaveBeenCalled();
    expect(browser.dtrum.enableSessionReplay).toHaveBeenCalled();
  });
});
