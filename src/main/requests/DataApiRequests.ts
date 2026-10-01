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
import type { CachePolicy } from './utils/RequestCache';
import { requestCache } from './utils/RequestCache';
import { dataApi } from './utils/axiosConfig';
import { toSafeErrorDetails } from './utils/safeErrorDetails';

const logger = Logger.getLogger('app');

const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;
const PROTECTED_HEALTH_TIMEOUT_MS = 2_000;

export type FileStreamResult = {
  stream: Readable;
  headers: {
    contentType?: string;
    contentDisposition?: string;
    contentLength?: string;
  };
};

export class DataApiRequests {
  constructor() {
    // Initialise cache service TTL values from config
    requestCache.setCacheTtl('reference', Number(appConfig.get('dataApiCache.referenceTtlMs')));
    requestCache.setCacheTtl('admin', Number(appConfig.get('dataApiCache.adminTtlMs')));
  }

  private async get<T>(
    url: string,
    parser: (data: unknown) => T,
    config: AxiosRequestConfig = {},
    options: {
      timeoutMs?: number;
      cachePolicy?: CachePolicy;
    } = {}
  ): Promise<T> {
    const { timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS, cachePolicy } = options;

    if (cachePolicy) {
      const cached = requestCache.get<T>(url, config, cachePolicy);
      if (cached.isValid && cached.cached !== undefined) {
        return structuredClone(await cached.cached);
      }
    }

    const parsedResponse = this.executeGet<unknown>(url, config, timeoutMs).then((response): T =>
      parser(response.data)
    );

    if (cachePolicy) {
      requestCache.set(url, config, cachePolicy, parsedResponse);

      try {
        return structuredClone(await parsedResponse);
      } catch (error) {
        requestCache.invalidate(url, config, cachePolicy, parsedResponse);
        throw error;
      }
    }

    return parsedResponse;
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

  private handleError(error: unknown, message: string, mapping?: DataApiErrorMapping): DataApiError {
    logger.error(message, toSafeErrorDetails(error));
    return mapDataApiError(error, mapping);
  }

  /**
   * Request to data API to check health
   */
  public async checkHealth(): Promise<boolean> {
    try {
      const response = await this.get<{ status: string }>('/health', data => data as { status: string });
      logger.info('Data API health check response:', response);
      return response.status === 'UP';
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
      await this.get('/search/services/v1', () => undefined, {}, { timeoutMs: PROTECTED_HEALTH_TIMEOUT_MS });
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
      return await this.get<Court>(
        `/courts/slug/${slug}/v1`,
        data => courtSchema.parse(data),
        {},
        { cachePolicy: 'admin' }
      );
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
      return await this.get<ServiceCentreDetails>(
        `/service-centres/slug/${slug}/v1`,
        data => serviceCentreDetailsSchema.parse(data),
        {},
        { cachePolicy: 'admin' }
      );
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
      return await this.get<AllLocationDetails[]>(
        '/all/details.json',
        data => allLocationDetailsSchema.array().parse(data),
        {},
        { cachePolicy: 'admin' }
      );
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
      return await this.get<CourtSearchResult[]>(
        'search/courts/v1/name',
        data => courtSearchResultSchema.array().parse(data),
        { params: { q: query } },
        { cachePolicy: 'admin' }
      );
    } catch (error: unknown) {
      return this.handleError(error, `Error fetching courts for query ${query}:`, { badRequest: true });
    }
  }

  /**
   * Request all service details from the API
   */
  public async getAllServices(): Promise<Service[] | DataApiError> {
    try {
      return await this.get<Service[]>(
        '/search/services/v1',
        data => serviceSchema.array().parse(data),
        {},
        { cachePolicy: 'reference' }
      );
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
      return await this.get<ServiceArea[]>(
        '/search/services/v1/' + serviceName + '/service-areas',
        data => serviceAreaSchema.array().parse(data),
        {},
        {
          cachePolicy: 'reference',
        }
      );
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
      return await this.get<CourtSearchResult[]>(
        '/search/courts/v1/prefix',
        data => courtSearchResultSchema.array().parse(data),
        { params: { prefix } },
        { cachePolicy: 'admin' }
      );
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
      return await this.get<ServiceAreaSearchResult[]>(
        `/search/service-area/v1/${serviceAreaName}`,
        data => serviceAreaSearchResultSchema.array().parse(data),
        {},
        { cachePolicy: 'admin' }
      );
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
      return await this.get<SearchResult[]>(
        '/search/locations/v1/postcode',
        data => searchResultSchema.array().parse(data),
        config,
        {
          cachePolicy: 'admin',
        }
      );
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
      return await this.get<CourtWithDistance[]>(
        '/search/courts/v1/postcode',
        data => courtWithDistanceSchema.array().parse(data),
        config,
        { cachePolicy: 'admin' }
      );
    } catch (error: unknown) {
      return this.handleError(error, 'Error fetching postcode search results:', { badRequest: true });
    }
  }

  public async getFileStream(
    location: string,
    mapping?: DataApiErrorMapping
  ): Promise<FileStreamResult | DataApiError> {
    try {
      // don't go through the caching layer for file streams, as they are not
      // cacheable, and we want to stream them directly
      const response = await this.executeGet<Readable>(
        location,
        { responseType: 'stream' },
        DEFAULT_REQUEST_TIMEOUT_MS
      );

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
