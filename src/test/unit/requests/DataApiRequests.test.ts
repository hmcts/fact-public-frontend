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

  describe('getCourt', () => {
    const courtSlug = 'reading-county-court';

    const mockCourt = {
      id: '1',
      name: 'Reading County Court',
      slug: courtSlug,
      open: true,
      warningNotice: null,
      lastUpdatedAt: '2023-01-01',
      openOnCath: null,
      mrdId: null,
      region: { name: 'South East', country: 'England' },
      courtDxCodes: [],
      courtCodes: [],
      courtFaxNumbers: [],
      courtAddresses: [],
      courtOpeningHours: [],
      courtCounterServiceOpeningHours: [],
      courtContactDetails: [],
      courtTranslations: [],
      courtAccessibilityOptions: [],
      courtFacilities: [],
      courtProfessionalInformation: [],
      courtAreasOfLaw: [],
    };

    it('should return court details when API call is successful', async () => {
      getStub.withArgs(`courts/slug/${courtSlug}.json`).resolves({ data: mockCourt });

      const response = await dataApiRequests.getCourt(courtSlug);
      expect(response).toEqual(mockCourt);
    });

    it('should return HttpStatusCode when API call fails with non-404', async () => {
      const error = {
        isAxiosError: true,
        response: { status: 500 },
      };
      getStub.withArgs(`courts/slug/${courtSlug}.json`).rejects(error);

      const response = await dataApiRequests.getCourt(courtSlug);
      expect(response).toEqual(500);
    });

    it('should return 404 HttpStatusCode when API call returns 404', async () => {
      const error404 = {
        isAxiosError: true,
        response: { status: 404 },
      };
      getStub.withArgs(`courts/slug/${courtSlug}.json`).rejects(error404);

      const response = await dataApiRequests.getCourt(courtSlug);
      expect(response).toEqual(404);
    });
  });

  describe('getAllCourts', () => {
    const mockCourt = {
      id: '1',
      name: 'Reading County Court',
      slug: 'reading-county-court',
      open: true,
      warningNotice: null,
      lastUpdatedAt: '2023-01-01',
      openOnCath: null,
      mrdId: null,
      region: { name: 'South East', country: 'England' },
      courtDxCodes: [],
      courtCodes: [],
      courtFaxNumbers: [],
      courtAddresses: [],
      courtOpeningHours: [],
      courtCounterServiceOpeningHours: [],
      courtContactDetails: [],
      courtTranslations: [],
      courtAccessibilityOptions: [],
      courtFacilities: [],
      courtProfessionalInformation: [],
      courtAreasOfLaw: [],
    };

    it('should return court details when API call is successful', async () => {
      const mockData = [mockCourt];
      getStub.withArgs('courts/all.json').resolves({ data: mockData });

      const response = await dataApiRequests.getAllCourts();
      expect(response).toEqual(mockData);
    });

    it('should return HttpStatusCode when API call fails', async () => {
      const error = {
        isAxiosError: true,
        response: { status: 500 },
      };
      getStub.withArgs('courts/all.json').rejects(error);

      const response = await dataApiRequests.getAllCourts();
      expect(response).toEqual(500);
    });
  });
});
