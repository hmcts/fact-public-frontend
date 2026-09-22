import { Readable } from 'node:stream';

import { AxiosRequestConfig } from 'axios';

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

export type FileStreamResult = {
  stream: Readable;
  headers: {
    contentType?: string;
    contentDisposition?: string;
    contentLength?: string;
  };
};

export class DataApiRequests {
  private handleError(error: unknown, message: string, mapping?: DataApiErrorMapping): DataApiError {
    logger.error(message, toSafeErrorDetails(error));
    return mapDataApiError(error, mapping);
  }

  /**
   * Request to data API to check health
   */
  public async checkHealth(): Promise<boolean> {
    try {
      const response = await dataApi.get('/health');
      logger.info('Data API health check response:', response.data);
      return response.data.status === 'UP';
    } catch (error) {
      logger.error('Error checking data API health:', toSafeErrorDetails(error));
    }
    return false;
  }

  /**
   * Request to data API to get court details by slug
   *
   * @param slug The slug identifier for the court
   */
  public async getCourtDetails(slug: string): Promise<Court | DataApiError> {
    try {
      const response = await dataApi.get(`/courts/slug/${slug}/v1`);
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
      const response = await dataApi.get(`/service-centres/slug/${slug}/v1`);
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
      const response = await dataApi.get('/all/details.json');
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
      const response = await dataApi.get('search/courts/v1/name', { params: { q: query } });
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
      const response = await dataApi.get('/search/services/v1');
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
      const response = await dataApi.get('/search/services/v1/' + serviceName + '/service-areas');
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
      const response = await dataApi.get('/search/courts/v1/prefix', { params: { prefix } });
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
      const response = await dataApi.get(`/search/service-area/v1/${serviceAreaName}`);
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
      const response = await dataApi.get('/search/locations/v1/postcode', config);
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
      const response = await dataApi.get('/search/courts/v1/postcode', config);
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
      const response = await dataApi.get(location, {
        responseType: 'stream',
      });

      return {
        stream: response.data as Readable,
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
