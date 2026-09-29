import { ClientSecretCredential } from '@azure/identity';
import { Mutex } from 'async-mutex';
import { InternalAxiosRequestConfig, create } from 'axios';
import config from 'config';

const tokenMutex = new Mutex();

const OPEN_URLS = new Set<string>(['/health']);

const apiAppRegId: string = config.get('secrets.fact-kv.API_APP_REG_ID');
const clientAppRegId: string = config.get('secrets.fact-kv.FRONTEND_APP_REG_ID');
const clientSecret: string = config.get('secrets.fact-kv.FRONTEND_APP_REG_SECRET');
const tenantId: string = process.env.AZURE_TENANT_ID || '';

export const dataApiUrl = process.env.DATA_API_URL || 'http://localhost:8989';

export const dataApi = create({
  baseURL: dataApiUrl,
  timeout: 20000,
});

let cachedTokenRefreshTS: number = 0;
let cachedToken: string | null = null;

// if an abort signal is provided, it will be passed to both the token acquisition and
// the axios request, so if either takes too long, the whole operation will be aborted.
function getToken(abortSignal?: AbortSignal): Promise<string> {
  return tokenMutex.runExclusive(async () => {
    if (abortSignal?.aborted) {
      throw new Error('Token request aborted');
    }

    if (!cachedToken || Date.now() > cachedTokenRefreshTS) {
      const cred = new ClientSecretCredential(tenantId, clientAppRegId, clientSecret);

      const at = await cred.getToken(`api://${apiAppRegId}/.default`, { abortSignal });

      // if a refresh TS has been specified, use it, otherwise
      // set it to midway between now and the expiry
      if (at.refreshAfterTimestamp) {
        cachedTokenRefreshTS = at.refreshAfterTimestamp;
      } else {
        const lifeSpan = at.expiresOnTimestamp - Date.now();
        cachedTokenRefreshTS = Date.now() + lifeSpan / 2;
      }
      cachedToken = at.token;
    }
    return cachedToken;
  });
}

export async function processRequest(cfg: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
  const url = cfg.url ?? '';
  // don't add a bearer token for open paths
  if (!OPEN_URLS.has(url)) {
    const token = await getToken(cfg.signal as AbortSignal | undefined);
    if (token) {
      cfg.headers = cfg.headers ?? {};
      cfg.headers.Authorization = `Bearer ${token}`;
    }
  }
  return cfg;
}

dataApi.interceptors.request.use(async cfg => {
  return processRequest(cfg);
});
