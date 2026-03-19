import { expect } from 'chai';
import request from 'supertest';

jest.mock('../../main/requests/DataApiRequests', () => {
  const dataApiMock = { getCourtDetails: jest.fn() };
  return {
    DataApiRequests: jest.fn().mockImplementation(() => dataApiMock),
    __dataApiMock: dataApiMock,
  };
});

const { app } = require('../../main/app');

const getMocks = () => {
  const dataApi = require('../../main/requests/DataApiRequests');
  return dataApi.__dataApiMock as { getCourtDetails: jest.Mock };
};

const buildCourt = (open: boolean) => ({
  id: '1',
  name: 'Test Court',
  slug: 'test-court',
  open,
  warningNotice: null,
  lastUpdatedAt: '2024-01-01T00:00:00.000Z',
  openOnCath: null,
  mrdId: null,
  region: { name: 'Region', country: 'Country' },
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
  courtPhotos: [],
});

describe('Court routes', () => {
  afterEach(() => {
    const dataApiMock = getMocks();
    dataApiMock.getCourtDetails.mockReset();
  });

  test('GET /courts/:slug renders court page when open', async () => {
    const dataApiMock = getMocks();
    dataApiMock.getCourtDetails.mockResolvedValue(buildCourt(true));

    await request(app)
      .get('/courts/test-court')
      .expect(res => {
        expect(res.status).to.equal(200);
        expect(res.text).to.include('Test Court');
      });
  });

  test('GET /courts/:slug renders court-closed page when closed', async () => {
    const dataApiMock = getMocks();
    dataApiMock.getCourtDetails.mockResolvedValue(buildCourt(false));

    await request(app)
      .get('/courts/test-court')
      .expect(res => {
        expect(res.status).to.equal(200);
        expect(res.text).to.include('Search for an alternative court or tribunal');
      });
  });

  test('GET /courts/:slug renders not-found on 404', async () => {
    const dataApiMock = getMocks();
    dataApiMock.getCourtDetails.mockResolvedValue(404);

    await request(app)
      .get('/courts/missing-court')
      .expect(res => {
        expect(res.status).to.equal(404);
        expect(res.text).to.include('Page Not Found');
      });
  });
});
