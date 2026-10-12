type DomContentLoadedHandler = () => void;

const loadModule = (querySelector: jest.Mock): DomContentLoadedHandler => {
  jest.resetModules();
  const addEventListener = jest.fn();
  (global as { document: unknown }).document = { addEventListener, querySelector };

  require('../../../main/bundles/focus-on-load');

  const call = addEventListener.mock.calls.find(([event]) => event === 'DOMContentLoaded');
  if (!call) {
    throw new Error('Missing DOMContentLoaded listener');
  }
  return call[1] as DomContentLoadedHandler;
};

describe('focus-on-load bundle', () => {
  afterEach(() => {
    delete (global as { document?: unknown }).document;
  });

  test('does nothing when document is unavailable (non-browser environment)', () => {
    jest.resetModules();
    delete (global as { document?: unknown }).document;

    expect(() => require('../../../main/bundles/focus-on-load')).not.toThrow();
  });

  test('registers a DOMContentLoaded listener that focuses the .js-focus-on-load target', () => {
    const focus = jest.fn();
    const querySelector = jest.fn().mockReturnValue({ focus });
    const handler = loadModule(querySelector);

    handler();

    expect(querySelector).toHaveBeenCalledWith('.js-focus-on-load');
    expect(focus).toHaveBeenCalledTimes(1);
  });

  test('does nothing when there is no .js-focus-on-load element on the page', () => {
    const querySelector = jest.fn().mockReturnValue(null);
    const handler = loadModule(querySelector);

    expect(() => handler()).not.toThrow();
    expect(querySelector).toHaveBeenCalledWith('.js-focus-on-load');
  });
});
