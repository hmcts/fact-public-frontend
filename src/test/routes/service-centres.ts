import { expect } from 'chai';
import request from 'supertest';

jest.mock('../../main/requests/DataApiRequests', () => {
  const dataApiMock = { getServiceCentreDetails: jest.fn() };
  return {
    DataApiRequests: jest.fn().mockImplementation(() => dataApiMock),
    __dataApiMock: dataApiMock,
  };
});

const { app } = require('../../main/app');

const getMocks = () => {
  const dataApi = require('../../main/requests/DataApiRequests');
  return dataApi.__dataApiMock as { getServiceCentreDetails: jest.Mock };
};

const buildServiceCentre = (open: boolean) => ({
  id: 'service-centre-id',
  name: 'Test Service Centre',
  slug: 'test-service-centre',
  open,
  warningNotice: 'Important service update',
  warningNoticeCy: 'Diweddariad gwasanaeth pwysig',
  createdAt: '2024-01-01T00:00:00.000Z',
  lastUpdatedAt: '2024-01-15T10:00:00.000Z',
  regionId: 'region-id',
  serviceAreas: [],
  catchmentType: null,
  serviceCentreAddresses: [
    {
      addressLine1: '1 Service Street',
      addressLine2: null,
      townCity: 'London',
      county: null,
      postcode: 'SW1A 1AA',
      lat: null,
      lon: null,
      addressType: 'WRITE_TO_US',
    },
  ],
  serviceCentreContactDetails: [
    {
      explanation: 'For general enquiries',
      explanationCy: 'Ar gyfer ymholiadau cyffredinol',
      email: 'service@example.com',
      phoneNumber: '0300 123 4567',
      serviceCentreContactDescription: { name: 'Enquiries', nameCy: 'Ymholiadau' },
    },
  ],
  serviceCentreAreasOfLaw: [],
});

describe('Service centre routes', () => {
  afterEach(() => {
    getMocks().getServiceCentreDetails.mockReset();
  });

  test('GET /service-centres/:slug renders the populated detail page', async () => {
    getMocks().getServiceCentreDetails.mockResolvedValue(buildServiceCentre(true));

    await request(app)
      .get('/service-centres/test-service-centre')
      .expect(res => {
        expect(res.status).to.equal(200);
        expect(res.text).to.include('Test Service Centre');
        expect(res.text).to.include('15 January 2024');
        expect(res.text).to.include('Important service update');
        expect(res.text).to.include('Send documents to');
        expect(res.text).to.include('Scammers');
        expect(res.text).to.include('Contact details');
        expect(res.text).to.include('Cases heard');
        expect(res.text).not.to.include('Coming soon!');
      });
  });

  test('GET /service-centres/:slug renders localized Welsh content', async () => {
    getMocks().getServiceCentreDetails.mockResolvedValue(buildServiceCentre(true));

    await request(app)
      .get('/service-centres/test-service-centre?lng=cy')
      .expect(res => {
        expect(res.status).to.equal(200);
        expect(res.text).to.include('Adolygwyd y dudalen hon ddiwethaf ar:');
        expect(res.text).to.include('Anfonwch ddogfennau i');
        expect(res.text).to.include('Gwybodaeth ddefnyddiol');
        expect(res.text).to.include('Manylion cyswllt');
        expect(res.text).to.include('Diweddariad gwasanaeth pwysig');
        expect(res.text).not.to.include('Important service update');
        expect(res.text).to.include('Ymholiadau');
        expect(res.text).to.include('Ar gyfer ymholiadau cyffredinol');
        expect(res.text).not.to.include('For general enquiries');
      });
  });

  test('GET /service-centres/:slug renders service-centre closed copy', async () => {
    getMocks().getServiceCentreDetails.mockResolvedValue(buildServiceCentre(false));

    await request(app)
      .get('/service-centres/test-service-centre')
      .expect(res => {
        expect(res.status).to.equal(200);
        expect(res.text).to.include('This service centre is no longer in service.');
        expect(res.text).to.include('Search for an alternative court, tribunal or service centre');
      });
  });

  test('GET /service-centres/:slug renders not-found on 404', async () => {
    getMocks().getServiceCentreDetails.mockResolvedValue(404);

    await request(app)
      .get('/service-centres/missing-service-centre')
      .expect(res => {
        expect(res.status).to.equal(404);
        expect(res.text).to.include('Page Not Found');
      });
  });
});
