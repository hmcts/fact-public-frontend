import { InternalAxiosRequestConfig } from 'axios';

type TokenPayload = {
  token: string;
  expiresOnTimestamp: number;
  refreshAfterTimestamp?: number;
};

const loadAxiosConfigWithMockedCredential = async (tokenPayload: TokenPayload) => {
  const getToken = jest.fn().mockResolvedValue(tokenPayload);
  const ClientSecretCredential = jest.fn().mockImplementation(() => ({ getToken }));

  jest.doMock('@azure/identity', () => ({
    ClientSecretCredential,
  }));

  const module = await import('../../../../main/requests/utils/axiosConfig');
  return { module, getToken, ClientSecretCredential };
};

describe('axiosConfig additional coverage', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('uses expiry midpoint when refreshAfterTimestamp is not provided', async () => {
    const { module, getToken } = await loadAxiosConfigWithMockedCredential({
      token: 'midpoint-token',
      expiresOnTimestamp: Date.now() + 60_000,
    });

    const firstConfig = { url: '/protected-first' } as InternalAxiosRequestConfig;
    const firstResult = await module.processRequest(firstConfig);
    const secondResult = await module.processRequest({ url: '/protected-second' } as InternalAxiosRequestConfig);

    expect(firstResult.headers?.Authorization).toBe('Bearer midpoint-token');
    expect(secondResult.headers?.Authorization).toBe('Bearer midpoint-token');
    expect(getToken).toHaveBeenCalledTimes(1);
  });

  test('registers a request interceptor that delegates to processRequest', async () => {
    const { module } = await loadAxiosConfigWithMockedCredential({
      token: 'refresh-token',
      expiresOnTimestamp: Date.now() + 60_000,
      refreshAfterTimestamp: Date.now() + 30_000,
    });

    const handlers = (
      module.dataApi.interceptors.request as unknown as {
        handlers: { fulfilled: (cfg: InternalAxiosRequestConfig) => Promise<InternalAxiosRequestConfig> }[];
      }
    ).handlers;

    expect(handlers.length).toBeGreaterThan(0);

    const cfg = { url: '/health' } as InternalAxiosRequestConfig;
    const processed = await handlers[0].fulfilled(cfg);

    expect(processed).toBe(cfg);
    expect(processed.headers?.Authorization).toBeUndefined();
  });

  test('treats an undefined URL as protected and adds an Authorization header', async () => {
    const { module } = await loadAxiosConfigWithMockedCredential({
      token: 'no-url-token',
      expiresOnTimestamp: Date.now() + 60_000,
      refreshAfterTimestamp: Date.now() + 30_000,
    });

    const cfg = {} as InternalAxiosRequestConfig;
    const processed = await module.processRequest(cfg);

    expect(processed.headers?.Authorization).toBe('Bearer no-url-token');
  });

  test('does not set Authorization header when token retrieval resolves to an empty token', async () => {
    const { module } = await loadAxiosConfigWithMockedCredential({
      token: '',
      expiresOnTimestamp: Date.now() + 60_000,
      refreshAfterTimestamp: Date.now() + 30_000,
    });

    const cfg = { url: '/protected' } as InternalAxiosRequestConfig;
    const processed = await module.processRequest(cfg);

    expect(processed.headers?.Authorization).toBeUndefined();
  });
});
