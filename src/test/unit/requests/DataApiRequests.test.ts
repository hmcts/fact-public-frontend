import sinon, { restore, stub } from 'sinon';

import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import { dataApi } from '../../../main/requests/utils/axiosConfig';

const dataApiRequests = new DataApiRequests();

const errorResponse = {
  response: {
    data: 'test error',
  },
};

const errorMessage = {
  message: 'test',
};

describe('DataApiRequests', () => {
  let getStub: sinon.SinonStub;

  beforeEach(() => {
    restore();
    getStub = stub(dataApi, 'get');
  });

  it('returns true when health status is UP', async () => {
    getStub.withArgs('/health').resolves({ data: { status: 'UP' } });
    const response = await dataApiRequests.checkHealth();
    expect(response).toBe(true);
  });

  it('returns false when health status is not UP', async () => {
    getStub.withArgs('/health').resolves({ data: { status: 'DOWN' } });
    const response = await dataApiRequests.checkHealth();
    expect(response).toBe(false);
  });

  it('returns false on error response', async () => {
    getStub.withArgs('/health').rejects(errorResponse);
    const response = await dataApiRequests.checkHealth();
    expect(response).toBe(false);
  });

  it('returns false on error message', async () => {
    getStub.withArgs('/health').rejects(errorMessage);
    const response = await dataApiRequests.checkHealth();
    expect(response).toBe(false);
  });

  describe('getCourtDetails', () => {
    const courtSlug = 'reading-county-court';

    it('should return court details when API call is successful', async () => {
      const mockData = { name: 'Reading County Court', slug: courtSlug };
      getStub.withArgs(`courts/slug/${courtSlug}.json`).resolves({ data: mockData });

      const response = await dataApiRequests.getCourtDetails(courtSlug);
      expect(response).toEqual(mockData);
    });

    it('should throw an error when API call fails with non-404', async () => {
      getStub.withArgs(`courts/slug/${courtSlug}.json`).rejects(new Error('API Error'));

      await expect(dataApiRequests.getCourtDetails(courtSlug)).rejects.toThrow('API Error');
    });

    it('should throw an error when API call returns 404', async () => {
      const error404 = { response: { status: 404 } };
      getStub.withArgs(`courts/slug/${courtSlug}.json`).rejects(error404);

      await expect(dataApiRequests.getCourtDetails(courtSlug)).rejects.toEqual(error404);
    });
  });

  describe('getAllCourtDetails', () => {
    it('should return court details when API call is successful', async () => {
      const mockData = [
        { name: 'Reading County Court', slug: 'reading-county-court' },
        { name: 'London Court', slug: 'london-court' },
      ];
      getStub.withArgs('courts/all.json').resolves({ data: mockData });

      const response = await dataApiRequests.getAllCourtDetails();
      expect(response).toEqual(mockData);
    });

    it('should throw an error when API call fails', async () => {
      getStub.withArgs('courts/all.json').rejects(new Error('API Error'));

      await expect(dataApiRequests.getAllCourtDetails()).rejects.toThrow('API Error');
    });
  });
});
