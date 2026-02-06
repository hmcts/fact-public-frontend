import { Logger } from '@hmcts/nodejs-logging';

import { CourtDetailsData } from '../interfaces/CourtDetailsData';

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
   * Request court details by slug from the API
   * @param slug The court slug
   */
  public async getCourtDetails(slug: string): Promise<CourtDetailsData> {
    try {
      const response = await dataApi.get(`courts/slug/${slug}.json`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching court details for slug [${slug}]:`, error);
      throw error;
    }
  }

  /**
   * Request all court details from the API
   */
  public async getAllCourtDetails(): Promise<CourtDetailsData[]> {
    try {
      const response = await dataApi.get('courts/all.json');
      return response.data;
    } catch (error) {
      logger.error('Error fetching court details:', error);
      throw error;
    }
  }
}
