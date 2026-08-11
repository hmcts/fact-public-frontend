import { Logger } from '@hmcts/nodejs-logging';
import { AxiosRequestConfig, HttpStatusCode, isAxiosError } from 'axios';

import { ServiceArea, serviceAreaSchema } from '../schemas/ServiceAreaSchema';
import { Service, serviceSchema } from '../schemas/ServiceSchema';
import {
  AllLocationDetails,
  ServiceCentreDetails,
  allLocationDetailsSchema,
  serviceCentreDetailsSchema,
} from '../schemas/allLocationDetails';
import { CourtBasic } from '../schemas/courtBasicSchema';
import { Court, CourtSearchResult, courtSchema, courtSearchResultSchema } from '../schemas/courtSchema';
import {
  CourtServiceAreas,
  ServiceAreaSearchResult,
  serviceAreaSearchResultSchema,
} from '../schemas/courtServiceAreas';
import { CourtWithDistance, courtWithDistanceSchema } from '../schemas/courtWithDistance';
import { SearchResult, searchResultSchema } from '../schemas/searchResult';

import { dataApi } from './utils/axiosConfig';
import { toSafeErrorDetails } from './utils/safeErrorDetails';

const logger = Logger.getLogger('app');

export class DataApiRequests {
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
  public async getCourtDetails(slug: string): Promise<Court | HttpStatusCode> {
    try {
      const response = await dataApi.get(`/courts/slug/${slug}/v1`);
      return courtSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error(`Error fetching court details for slug ${slug}:`, toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request service-centre details by slug.
   *
   * @param slug The slug identifier for the service centre
   */
  public async getServiceCentreDetails(slug: string): Promise<ServiceCentreDetails | HttpStatusCode> {
    try {
      const response = await dataApi.get(`/service-centres/slug/${slug}/v1`);
      return serviceCentreDetailsSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error(`Error fetching service-centre details for slug ${slug}:`, toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request all court and service-centre details from the API
   */
  public async getAll(): Promise<AllLocationDetails[] | HttpStatusCode> {
    try {
      const response = await dataApi.get('/all/details.json');
      return allLocationDetailsSchema.array().parse(response.data);
    } catch (error: unknown) {
      logger.error('Error fetching location details:', toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request courts by name/address query prefix from the API
   * @param query The search query
   */
  public async getByName(query: string): Promise<CourtSearchResult[] | HttpStatusCode> {
    try {
      const response = await dataApi.get('search/courts/v1/name', { params: { q: query } });
      return courtSearchResultSchema.array().parse(response.data);
    } catch (error: unknown) {
      logger.error(`Error fetching courts for query ${query}:`, toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request all service details from the API
   */
  public async getAllServices(): Promise<Service[] | HttpStatusCode> {
    try {
      const response = await dataApi.get('/search/services/v1');
      return serviceSchema.array().parse(response.data);
    } catch (error: unknown) {
      logger.error('Error fetching service details:', toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request all service area details for a given service from the API
   *
   * @param serviceName the name of the service
   */
  public async getServiceAreas(serviceName: string): Promise<ServiceArea[] | HttpStatusCode> {
    try {
      const response = await dataApi.get('/search/services/v1/' + serviceName + '/service-areas');
      return serviceAreaSchema.array().parse(response.data);
    } catch (error: unknown) {
      logger.error('Error fetching service area details:', toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request courts from the API that match the given prefix
   *
   * @param prefix the alphabetic prefix to search for
   */
  public async getCourtsByPrefix(prefix: string): Promise<CourtBasic[] | HttpStatusCode> {
    try {
      return (await dataApi.get('/search/courts/v1/prefix', { params: { prefix } })).data;
    } catch (error: unknown) {
      logger.error(`Error fetching court details for prefix ${prefix}:`, toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Perform a search for court service areas based on the service area name.
   *
   * @param serviceAreaName the name of the service area
   */
  public async getServiceAreaSearchResults(
    serviceAreaName: string
  ): Promise<ServiceAreaSearchResult[] | HttpStatusCode> {
    try {
      const response = await dataApi.get(`/search/service-area/v1/${serviceAreaName}`);
      return serviceAreaSearchResultSchema.array().parse(response.data);
    } catch (error: unknown) {
      logger.error('Error fetching court service area details:', toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Backward-compatible wrapper for older callers still using the previous method name.
   */
  public async getCourtServiceAreas(serviceAreaName: string): Promise<CourtServiceAreas[] | HttpStatusCode> {
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
  ): Promise<SearchResult[] | HttpStatusCode> {
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
      logger.error('Error fetching postcode search results:', toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Perform a postcode-only search for a close court.
   *
   * @param postcode the postcode
   */
  public async performPostcodeOnlySearch(postcode: string): Promise<CourtWithDistance[] | HttpStatusCode> {
    try {
      const config: AxiosRequestConfig = {
        params: {
          postcode,
        },
      };
      const response = await dataApi.get('/search/courts/v1/postcode', config);
      return courtWithDistanceSchema.array().parse(response.data);
    } catch (error: unknown) {
      logger.error('Error fetching postcode search results:', toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }
}
