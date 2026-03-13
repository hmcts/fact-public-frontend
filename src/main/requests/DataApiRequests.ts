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
   * Request to data API to create a test court
   *
   * @param courtName The name of the court to create
   * @param serviceCenter Whether the court is a service center
   */
  public async createTestCourt(courtName: string, serviceCenter: boolean): Promise<Court | HttpStatusCode> {
    try {
      const response = await dataApi.get('/testing-support/courts', {
        params: {
          courtName,
          serviceCenter,
        },
        responseType: 'json',
      });
      const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      return courtSchema.parse(data);
    } catch (error: unknown) {
      logger.error('Error creating test court:', error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to delete courts by name prefix
   *
   * @param courtNamePrefix The prefix of the court name to delete
   */
  public async deleteCourtsByNamePrefix(courtNamePrefix: string): Promise<string | HttpStatusCode> {
    try {
      const response = await dataApi.delete(`/testing-support/courts/name-prefix/${courtNamePrefix}`);
      return response.data;
    } catch (error: unknown) {
      logger.error(`Error deleting courts with prefix ${courtNamePrefix}:`, error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }
}
