import { Logger } from '@hmcts/nodejs-logging';
import { HttpStatusCode, isAxiosError } from 'axios';

import { ServiceArea, serviceAreaSchema } from '../schemas/ServiceAreaSchema';
import { Service, serviceSchema } from '../schemas/ServiceSchema';
import { CourtBasic } from '../schemas/courtBasicSchema';
import { Court, courtSchema } from '../schemas/courtSchema';

import { dataApi } from './utils/axiosConfig';

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
      logger.error('Error checking data API health:', error);
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
      logger.error(`Error fetching court details for slug ${slug}:`, error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request all court details from the API
   */
  public async getAll(): Promise<Court[] | HttpStatusCode> {
    try {
      const response = await dataApi.get('courts/all.json');
      return courtSchema.array().parse(response.data);
    } catch (error: unknown) {
      logger.error('Error fetching court details:', error);
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
      logger.error('Error fetching service details:', error);
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
      logger.error('Error fetching service area details:', error);
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
      const response = await dataApi.get('/search/courts/v1/prefix', {
        params: { prefix },
      });
      return response.data;
    } catch (error: unknown) {
      logger.error(`Error fetching court details for prefix ${prefix}:`, error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }
}
