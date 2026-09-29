import { Readable } from 'node:stream';

import { AxiosRequestConfig, AxiosResponse } from 'axios';
import appConfig from 'config';

import { Logger } from '../modules/logging';
import { ServiceArea, serviceAreaSchema } from '../schemas/ServiceAreaSchema';
import { Service, serviceSchema } from '../schemas/ServiceSchema';
import {
  AllLocationDetails,
  ServiceCentreDetails,
  allLocationDetailsSchema,
  serviceCentreDetailsSchema,
} from '../schemas/allLocationDetails';
import { Court, CourtSearchResult, courtSchema, courtSearchResultSchema } from '../schemas/courtSchema';
import { ServiceAreaSearchResult, serviceAreaSearchResultSchema } from '../schemas/courtServiceAreas';
import { CourtWithDistance, courtWithDistanceSchema } from '../schemas/courtWithDistance';
import { SearchResult, searchResultSchema } from '../schemas/searchResult';

import { DataApiError, DataApiErrorMapping, mapDataApiError } from './DataApiError';
import { dataApi } from './utils/axiosConfig';
import { toSafeErrorDetails } from './utils/safeErrorDetails';

const logger = Logger.getLogger('app');

const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;
const PROTECTED_HEALTH_TIMEOUT_MS = 2_000;
const MAX_CACHE_ENTRIES = 1_000;

type CachePolicy = 'reference' | 'admin';

type CacheEntry = {
  expiresAt: number;
  response: Promise<AxiosResponse<unknown>>;
};

export type FileStreamResult = {
  stream: Readable;
  headers: {
    contentType?: string;
    contentDisposition?: string;
    contentLength?: string;
  };
};

export class DataApiRequests {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly cacheTtlMs: Record<CachePolicy, number> = {
    reference: Number(appConfig.get('dataApiCache.referenceTtlMs')),
    admin: Number(appConfig.get('dataApiCache.adminTtlMs')),
  };

  private async get<T>(
    url: string,
    config: AxiosRequestConfig = {},
    options: {
      timeoutMs?: number;
      cachePolicy?: CachePolicy;
    } = {}
  ): Promise<AxiosResponse<T>> {
    const { timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS, cachePolicy } = options;
    if (!cachePolicy || this.cacheTtlMs[cachePolicy] <= 0) {
      return this.executeGet<T>(url, config, timeoutMs);
    }

    const cacheKey = this.createCacheKey(cachePolicy, url, config);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.response as Promise<AxiosResponse<T>>;
    }
    if (cached) {
      this.cache.delete(cacheKey);
    }

    const response = this.executeGet<T>(url, config, timeoutMs);
    const entry: CacheEntry = {
      expiresAt: Date.now() + this.cacheTtlMs[cachePolicy],
      response,
    };

    this.evictOldestEntryIfFull();
    this.cache.set(cacheKey, entry);

    try {
      return await response;
    } catch (error) {
      if (this.cache.get(cacheKey) === entry) {
        this.cache.delete(cacheKey);
      }
      throw error;
    }
  }

  private async executeGet<T>(url: string, config: AxiosRequestConfig, timeoutMs: number): Promise<AxiosResponse<T>> {
    const abortController = new AbortController();
    let timeout: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      timeout = setTimeout(() => {
        abortController.abort();
        reject(new Error(`Data API request timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([
        dataApi.get<T>(url, {
          ...config,
          signal: abortController.signal,
          timeout: timeoutMs,
        }),
        timeoutPromise,
      ]);
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }

  private createCacheKey(cachePolicy: CachePolicy, url: string, config: AxiosRequestConfig): string {
    const params = config.params as Record<string, unknown> | undefined;
    const sortedParams = params
      ? Object.fromEntries(Object.entries(params).sort(([left], [right]) => left.localeCompare(right)))
      : {};
    return `${cachePolicy}:${url}:${JSON.stringify(sortedParams)}`;
  }

  private evictOldestEntryIfFull(): void {
    if (this.cache.size < MAX_CACHE_ENTRIES) {
      return;
    }

    const oldestKey = this.cache.keys().next().value;
    if (oldestKey !== undefined) {
      this.cache.delete(oldestKey);
    }
  }

  private handleError(error: unknown, message: string, mapping?: DataApiErrorMapping): DataApiError {
    logger.error(message, toSafeErrorDetails(error));
    return mapDataApiError(error, mapping);
  }

  /**
   * Request to data API to check health
   */
  public async checkHealth(): Promise<boolean> {
    try {
      const response = await this.get<{ status: string }>('/health');
      logger.info('Data API health check response:', response.data);
      return response.data.status === 'UP';
    } catch (error) {
      logger.error('Error checking data API health:', toSafeErrorDetails(error));
    }
    return false;
  }

  /**
   * Check a protected Data API route to verify both availability and credentials.
   */
  public async checkProtectedHealth(): Promise<boolean> {
    try {
      await this.get('/search/services/v1', {}, { timeoutMs: PROTECTED_HEALTH_TIMEOUT_MS });
      return true;
    } catch (error) {
      logger.warn('Protected Data API health check failed:', toSafeErrorDetails(error));
      return false;
    }
  }

  /**
   * Request to data API to get court details by slug
   *
   * @param slug The slug identifier for the court
   */
  public async getCourtDetails(slug: string): Promise<Court | DataApiError> {
    try {
      const response = await this.get(`/courts/slug/${slug}/v1`, {}, { cachePolicy: 'admin' });
      return courtSchema.parse(response.data);
    } catch (error: unknown) {
      return this.handleError(error, `Error fetching court details for slug ${slug}:`, {
        badRequest: true,
        notFound: true,
      });
    }
  }

  /**
   * Request service-centre details by slug.
   *
   * @param slug The slug identifier for the service centre
   */
  public async getServiceCentreDetails(slug: string): Promise<ServiceCentreDetails | DataApiError> {
    try {
      const response = await this.get(`/service-centres/slug/${slug}/v1`, {}, { cachePolicy: 'admin' });
      return serviceCentreDetailsSchema.parse(response.data);
    } catch (error: unknown) {
      return this.handleError(error, `Error fetching service-centre details for slug ${slug}:`, {
        badRequest: true,
        notFound: true,
      });
    }
  }

  /**
   * Request all court and service-centre details from the API
   */
  public async getAll(): Promise<AllLocationDetails[] | DataApiError> {
    try {
      const response = await this.get('/all/details.json', {}, { cachePolicy: 'admin' });
      return allLocationDetailsSchema.array().parse(response.data);
    } catch (error: unknown) {
      return this.handleError(error, 'Error fetching location details:');
    }
  }

  /**
   * Request courts by name/address query prefix from the API
   * @param query The search query
   */
  public async getByName(query: string): Promise<CourtSearchResult[] | DataApiError> {
    try {
      const response = await this.get('search/courts/v1/name', { params: { q: query } }, { cachePolicy: 'admin' });
      return courtSearchResultSchema.array().parse(response.data);
    } catch (error: unknown) {
      return this.handleError(error, `Error fetching courts for query ${query}:`, { badRequest: true });
    }
  }

  /**
   * Request all service details from the API
   */
  public async getAllServices(): Promise<Service[] | DataApiError> {
    try {
      const response = await this.get('/search/services/v1', {}, { cachePolicy: 'reference' });
      return serviceSchema.array().parse(response.data);
    } catch (error: unknown) {
      return this.handleError(error, 'Error fetching service details:');
    }
  }

  /**
   * Request all service area details for a given service from the API
   *
   * @param serviceName the name of the service
   */
  public async getServiceAreas(serviceName: string): Promise<ServiceArea[] | DataApiError> {
    try {
      const response = await this.get(
        '/search/services/v1/' + serviceName + '/service-areas',
        {},
        {
          cachePolicy: 'reference',
        }
      );
      return serviceAreaSchema.array().parse(response.data);
    } catch (error: unknown) {
      return this.handleError(error, 'Error fetching service area details:', { badRequest: true, notFound: true });
    }
  }

  /**
   * Request courts from the API that match the given prefix
   *
   * @param prefix the alphabetic prefix to search for
   */
  public async getCourtsByPrefix(prefix: string): Promise<CourtSearchResult[] | DataApiError> {
    try {
      const response = await this.get('/search/courts/v1/prefix', { params: { prefix } }, { cachePolicy: 'admin' });
      return courtSearchResultSchema.array().parse(response.data);
    } catch (error: unknown) {
      return this.handleError(error, `Error fetching court details for prefix ${prefix}:`, { badRequest: true });
    }
  }

  /**
   * Perform a search for court service areas based on the service area name.
   *
   * @param serviceAreaName the name of the service area
   */
  public async getServiceAreaSearchResults(serviceAreaName: string): Promise<ServiceAreaSearchResult[] | DataApiError> {
    try {
      const response = await this.get(`/search/service-area/v1/${serviceAreaName}`, {}, { cachePolicy: 'admin' });
      return serviceAreaSearchResultSchema.array().parse(response.data);
    } catch (error: unknown) {
      return this.handleError(error, 'Error fetching court service area details:', {
        badRequest: true,
        notFound: true,
      });
    }
  }

  /**
   * Backward-compatible wrapper for older callers still using the previous method name.
   */
  public async getCourtServiceAreas(serviceAreaName: string): Promise<ServiceAreaSearchResult[] | DataApiError> {
    return this.getServiceAreaSearchResults(serviceAreaName);
  }

  /**
   * Perform a postcode search for the relevant action.
   *
   * @param postcode the postcode
   * @param serviceArea the service area (name)
   * @param action the action (nearest, documents, update)
   */
  public async performPostcodeSearch(
    postcode: string,
    serviceArea: string,
    action: string
  ): Promise<SearchResult[] | DataApiError> {
    try {
      const config: AxiosRequestConfig = {
        params: {
          postcode,
          serviceArea,
          action: action.toUpperCase(),
        },
      };
      const response = await this.get('/search/locations/v1/postcode', config, { cachePolicy: 'admin' });
      return searchResultSchema.array().parse(response.data);
    } catch (error: unknown) {
      return this.handleError(error, 'Error fetching postcode search results:', {
        badRequest: true,
        notFound: true,
      });
    }
  }

  /**
   * Perform a postcode-only search for a close court.
   *
   * @param postcode the postcode
   */
  public async performPostcodeOnlySearch(postcode: string): Promise<CourtWithDistance[] | DataApiError> {
    try {
      const config: AxiosRequestConfig = {
        params: {
          postcode,
        },
      };
      const response = await this.get('/search/courts/v1/postcode', config, { cachePolicy: 'admin' });
      return courtWithDistanceSchema.array().parse(response.data);
    } catch (error: unknown) {
      return this.handleError(error, 'Error fetching postcode search results:', { badRequest: true });
    }
  }

  public async getFileStream(
    location: string,
    mapping?: DataApiErrorMapping
  ): Promise<FileStreamResult | DataApiError> {
    try {
      const response = await this.get<Readable>(location, {
        responseType: 'stream',
      });

      return {
        stream: response.data,
        headers: {
          contentType: response.headers['content-type'] as string,
          contentDisposition: response.headers['content-disposition'],
          contentLength: response.headers['content-length'] as string,
        },
      };
    } catch (error: unknown) {
      return this.handleError(error, 'Error fetching download stream:', mapping);
    }
  }
}
