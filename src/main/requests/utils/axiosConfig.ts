import { EnvironmentCredential } from '@azure/identity';
import { Mutex } from 'async-mutex';
import { InternalAxiosRequestConfig, create } from 'axios';
import config from 'config';

const tokenMutex = new Mutex();

const OPEN_URLS = new Set<string>(['/health']);

const apiAppRegId: string = config.get('secrets.fact-kv.API_APP_REG_ID');

export const dataApiUrl = process.env.DATA_API_URL || 'http://localhost:8989';

export const dataApi = create({
  baseURL: dataApiUrl,
  timeout: 20000,
});

let cachedTokenRefreshTS: number = 0;
let cachedToken: string | null = null;

function getToken(): Promise<string> {
  return tokenMutex.runExclusive(async () => {
    if (!cachedToken || Date.now() > cachedTokenRefreshTS) {
      const cred = new EnvironmentCredential();

      const at = await cred.getToken(`api://${apiAppRegId}/.default`);

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
    const token = await getToken();
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
