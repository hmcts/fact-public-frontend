import type { Server } from 'http';

describe('server.ts', () => {
  const serverPath = '../../../src/main/server';
  const originalNodeEnv = process.env.NODE_ENV;
  const originalPort = process.env.PORT;

  type SetupOptions = {
    env?: 'development' | 'production' | string;
    port?: string;
    closeError?: Error;
    closeCallsCallback?: boolean;
  };

  function setup({ env = 'development', port, closeError, closeCallsCallback = true }: SetupOptions = {}) {
    jest.resetModules();
    jest.useFakeTimers();

    process.env.NODE_ENV = env;
    if (port === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = port;
    }

    const logInfo = jest.fn();
    const logError = jest.fn();
    const getLogger = jest.fn(() => ({ info: logInfo, error: logError }));

    const close = jest.fn((callback?: (error?: Error) => void) => {
      if (closeCallsCallback && callback) {
        callback(closeError);
      }
    });
    const closeAllConnections = jest.fn();
    const activeServer = { close, closeAllConnections } as unknown as Server;

    const appListen = jest.fn((_port: number, callback?: () => void) => {
      callback?.();
      return activeServer;
    });
    const appMock = {
      app: {
        locals: {
          ENV: env,
          shutdown: false,
        },
        listen: appListen,
      },
    };

    const readFileSync = jest.fn((filePath: string) => Buffer.from(`mock:${filePath}`));
    const httpsListen = jest.fn((_port: number, callback?: () => void) => callback?.());
    const httpsCreateServer = jest.fn(() => ({ ...activeServer, listen: httpsListen }));

    let sigintHandler: NodeJS.SignalsListener | undefined;
    let sigtermHandler: NodeJS.SignalsListener | undefined;
    const processOnSpy = jest.spyOn(process, 'on').mockImplementation((event, handler) => {
      if (event === 'SIGINT') {
        sigintHandler = handler as NodeJS.SignalsListener;
      }
      if (event === 'SIGTERM') {
        sigtermHandler = handler as NodeJS.SignalsListener;
      }
      return process;
    });
    const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => undefined) as never);

    jest.doMock('../../../src/main/modules/logging', () => ({ Logger: { getLogger } }));
    jest.doMock('../../../src/main/app', () => appMock);
    jest.doMock('fs', () => ({ readFileSync }));
    jest.doMock('https', () => ({ createServer: httpsCreateServer }));

    jest.isolateModules(() => {
      jest.requireActual(serverPath);
    });

    return {
      appMock,
      appListen,
      close,
      closeAllConnections,
      httpsListen,
      httpsCreateServer,
      readFileSync,
      logInfo,
      logError,
      processOnSpy,
      processExitSpy,
      sigintHandler,
      sigtermHandler,
    };
  }

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
    jest.resetModules();
    restoreEnvironmentVariable('NODE_ENV', originalNodeEnv);
    restoreEnvironmentVariable('PORT', originalPort);
  });

  test('starts an HTTPS server on the default port in development', () => {
    const context = setup();

    expect(context.readFileSync).toHaveBeenCalledTimes(2);
    expect(context.readFileSync.mock.calls[0][0]).toContain('localhost.crt');
    expect(context.readFileSync.mock.calls[1][0]).toContain('localhost.key');
    expect(context.httpsCreateServer).toHaveBeenCalledTimes(1);
    expect(context.httpsListen).toHaveBeenCalledWith(3344, expect.any(Function));
    expect(context.logInfo).toHaveBeenCalledWith('Application started: https://localhost:3344');
    expect(context.appListen).not.toHaveBeenCalled();
  });

  test('uses the configured port in development', () => {
    const context = setup({ port: '4444' });

    expect(context.httpsListen).toHaveBeenCalledWith(4444, expect.any(Function));
  });

  test('starts an HTTP server outside development', () => {
    const context = setup({ env: 'production', port: '7788' });

    expect(context.httpsCreateServer).not.toHaveBeenCalled();
    expect(context.appListen).toHaveBeenCalledWith(7788, expect.any(Function));
    expect(context.logInfo).toHaveBeenCalledWith('Application started: http://localhost:7788');
  });

  test('registers both shutdown signal handlers', () => {
    const context = setup();

    expect(context.processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    expect(context.processOnSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
  });

  test('marks the service unready immediately and closes after four seconds', () => {
    const context = setup({ env: 'production' });

    invokeSignalHandler(context.sigtermHandler, 'SIGTERM');

    expect(context.appMock.app.locals.shutdown).toBe(true);
    jest.advanceTimersByTime(3999);
    expect(context.close).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(context.close).toHaveBeenCalledTimes(1);
    expect(context.processExitSpy).toHaveBeenCalledWith(0);
    expect(context.closeAllConnections).not.toHaveBeenCalled();
  });

  test('forces connections closed and exits one when the deadline is exceeded', () => {
    const context = setup({ env: 'production', closeCallsCallback: false });

    invokeSignalHandler(context.sigintHandler, 'SIGINT');
    jest.advanceTimersByTime(4000);

    expect(context.close).toHaveBeenCalledTimes(1);
    expect(context.processExitSpy).not.toHaveBeenCalled();

    jest.advanceTimersByTime(4999);
    expect(context.closeAllConnections).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(context.closeAllConnections).toHaveBeenCalledTimes(1);
    expect(context.processExitSpy).toHaveBeenCalledWith(1);
  });

  test('force closes and exits one when closing the server fails', () => {
    const closeError = new Error('close failed');
    const context = setup({ env: 'production', closeError });

    invokeSignalHandler(context.sigtermHandler, 'SIGTERM');
    jest.advanceTimersByTime(4000);

    expect(context.logError).toHaveBeenCalledWith('Failed to close server: close failed');
    expect(context.closeAllConnections).toHaveBeenCalledTimes(1);
    expect(context.processExitSpy).toHaveBeenCalledWith(1);
  });

  test('starts shutdown only once when multiple signals are received', () => {
    const context = setup({ env: 'production', closeCallsCallback: false });

    invokeSignalHandler(context.sigintHandler, 'SIGINT');
    invokeSignalHandler(context.sigtermHandler, 'SIGTERM');
    jest.advanceTimersByTime(4000);

    expect(context.close).toHaveBeenCalledTimes(1);
    expect(context.logInfo).toHaveBeenCalledWith(
      '⚠️ Caught SIGINT, gracefully shutting down. Setting readiness to DOWN'
    );
    expect(context.logInfo).not.toHaveBeenCalledWith(
      '⚠️ Caught SIGTERM, gracefully shutting down. Setting readiness to DOWN'
    );
  });
});

function invokeSignalHandler(handler: NodeJS.SignalsListener | undefined, signal: NodeJS.Signals): void {
  if (!handler) {
    throw new Error(`${signal} handler was not registered`);
  }

  handler(signal);
}

function restoreEnvironmentVariable(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
