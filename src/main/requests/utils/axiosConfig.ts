import { DefaultAzureCredential, DefaultAzureCredentialClientIdOptions } from '@azure/identity';
import { Logger } from '@hmcts/nodejs-logging';
import { Mutex } from 'async-mutex';
import axios from 'axios';
import config from 'config';

const tokenMutex = new Mutex();

const OPEN_URLS = new Set<string>(['/health']);

const clientAppRegId: string = config.get('secrets.fact-kv.public-frontend-app-reg-id');
const apiAppRegId: string = config.get('secrets.fact-kv.api-app-reg-id');
const wlOptions: DefaultAzureCredentialClientIdOptions = {
  workloadIdentityClientId: clientAppRegId,
};

const logger = Logger.getLogger('server');

export const dataApiUrl = process.env.DATA_API_URL || 'http://localhost:8989';

export const dataApi = axios.create({
  baseURL: dataApiUrl,
  timeout: 20000,
});

let cachedTokenRefreshTS: number = 0;
let cachedToken: string | null = null;

function getToken(): Promise<string> {
  return tokenMutex.runExclusive(async () => {
    if (!cachedToken || Date.now() > cachedTokenRefreshTS) {
      logger.info(`using client app reg id ending: ${clientAppRegId.slice(-4)}`);
      const cred = new DefaultAzureCredential(wlOptions);
      const at = await cred.getToken(`api://${apiAppRegId}/.default`);
      // if a refresh TS has been specified, use it, otherwise
      // set it to midway between now and the expiry
      if(at.refreshAfterTimestamp) {
        cachedTokenRefreshTS = at.refreshAfterTimestamp;
      } else {
        const lifeSpan = at.expiresOnTimestamp - Date.now();
        cachedTokenRefreshTS = Date.now() + (lifeSpan / 2);
      }
      cachedToken = at.token;
    }
    return cachedToken;
  });
}

dataApi.interceptors.request.use(async cfg => {
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
});
