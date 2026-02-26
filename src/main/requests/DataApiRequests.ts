import { Logger } from '@hmcts/nodejs-logging';
import { HttpStatusCode, isAxiosError } from 'axios';

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
   * Request court details by slug from the API
   * @param slug The court slug identifier
   */
  public async getCourt(slug: string): Promise<Court | HttpStatusCode> {
    try {
      const response = await dataApi.get(`courts/slug/${slug}`);
      return courtSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error(`Error fetching court for slug ${slug}:`, error);
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
}
