const delegateLogger = {
  silly: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
const trackTrace = jest.fn();

jest.mock('@hmcts/nodejs-logging', () => ({
  Logger: {
    getLogger: jest.fn().mockReturnValue(delegateLogger),
  },
}));

import { Logger, setAppInsightsClient } from '../../../../main/modules/logging';

describe('Logger', () => {
  beforeAll(() => {
    setAppInsightsClient({ trackTrace });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('writes errors to the console logger and Application Insights', () => {
    const logger = Logger.getLogger('app');
    const details = {
      name: 'ZodError',
      message: 'Data API response failed schema validation',
      issueCount: 1,
      issues: [
        {
          code: 'invalid_type',
          path: 'courtAccessibilityOptions',
          message: 'Invalid input: expected string, received null',
        },
      ],
    };

    logger.error('Error fetching court details:', details);

    expect(delegateLogger.error).toHaveBeenCalledWith('Error fetching court details:', details);
    expect(trackTrace).toHaveBeenCalledWith({
      message: expect.stringContaining(
        'Error fetching court details: name=ZodError, message=Data API response failed schema validation'
      ),
      severity: 'Error',
      properties: {
        loggerName: 'app',
      },
    });
    expect(trackTrace.mock.calls[0][0].message).toContain(
      'issues=[code=invalid_type, path=courtAccessibilityOptions, message=Invalid input: expected string, received null]'
    );
  });

  test('writes every log level with the expected telemetry severity', () => {
    const logger = Logger.getLogger('levels');

    logger.silly('silly message');
    logger.debug('debug message');
    logger.verbose('verbose message');
    logger.info('info message');
    logger.warn('warn message');

    expect(delegateLogger.silly).toHaveBeenCalledWith('silly message');
    expect(delegateLogger.debug).toHaveBeenCalledWith('debug message');
    expect(delegateLogger.verbose).toHaveBeenCalledWith('verbose message');
    expect(delegateLogger.info).toHaveBeenCalledWith('info message');
    expect(delegateLogger.warn).toHaveBeenCalledWith('warn message');

    const severities = trackTrace.mock.calls.map(call => call[0].severity);
    expect(severities).toEqual(['Verbose', 'Verbose', 'Verbose', 'Information', 'Warning']);
  });

  test('formats dates, arrays and circular objects safely in telemetry messages', () => {
    const logger = Logger.getLogger('formatting');
    const when = new Date('2024-01-01T00:00:00.000Z');
    const circular: { label: string; self?: unknown } = { label: 'node' };
    circular.self = circular;

    logger.info('value', when, [1, 'two'], circular);

    const message = trackTrace.mock.calls[0][0].message;
    expect(message).toContain('2024-01-01T00:00:00.000Z');
    expect(message).toContain('[1, two]');
    expect(message).toContain('self=[Circular]');
  });

  test('uses stack traces for Error arguments when available', () => {
    const logger = Logger.getLogger('stacked-error');
    const error = new Error('Stacked failure');

    logger.error(error);

    expect(trackTrace.mock.calls[0][0].message).toContain('Stacked failure');
  });

  test('falls back to Error name and message when stack is unavailable', () => {
    const logger = Logger.getLogger('fallback-error');
    const error = new Error('No stack error');
    error.stack = '';

    logger.error(error);

    expect(trackTrace.mock.calls[0][0].message).toContain('Error: No stack error');
  });

  test('does not interrupt console logging if telemetry throws', () => {
    trackTrace.mockImplementationOnce(() => {
      throw new Error('telemetry unavailable');
    });

    expect(() => Logger.getLogger('app').warn('Application warning')).not.toThrow();
    expect(delegateLogger.warn).toHaveBeenCalledWith('Application warning');
  });
});
