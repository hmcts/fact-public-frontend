import { Logger } from '@hmcts/nodejs-logging';
import { HttpStatusCode } from 'axios';
import { type SinonSandbox, createSandbox } from 'sinon';

import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import { dataApi } from '../../../main/requests/utils/axiosConfig';
import { courtSchema } from '../../../main/schemas/courtSchema';
import { CATCHMENT_TYPES } from '../../../main/schemas/courtServiceAreas';
import { SEARCH_RESULT_TYPES } from '../../../main/schemas/searchResult';

const validCourt = {
  id: 'a',
  name: 'A Court',
  slug: 'a-court',
  open: true,
  warningNotice: null,
  lastUpdatedAt: '2026-05-15',
  openOnCath: null,
  mrdId: null,
  region: {
    name: 'London',
    country: 'England',
  },
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
};

describe('DataApiRequests', () => {
  let sandbox: SinonSandbox;
  let requests: DataApiRequests;

  beforeEach(() => {
    sandbox = createSandbox();
    requests = new DataApiRequests();
    const appLogger = Logger.getLogger('app');
    sandbox.stub(appLogger, 'info');
    sandbox.stub(appLogger, 'error');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('checkHealth', () => {
    it('returns true when Data API status is UP', async () => {
      sandbox
        .stub(dataApi, 'get')
        .withArgs('/health')
        .resolves({ data: { status: 'UP' } });

      await expect(requests.checkHealth()).resolves.toBe(true);
    });

    it('returns false when Data API status is not UP', async () => {
      sandbox
        .stub(dataApi, 'get')
        .withArgs('/health')
        .resolves({ data: { status: 'DOWN' } });

      await expect(requests.checkHealth()).resolves.toBe(false);
    });

    it('returns false when health request throws', async () => {
      sandbox.stub(dataApi, 'get').withArgs('/health').rejects(new Error('network issue'));

      await expect(requests.checkHealth()).resolves.toBe(false);
    });
  });

  describe('getCourtDetails', () => {
    it('returns parsed court details on success', async () => {
      const payload = { raw: 'court' };
      const parsedCourt = { id: '1' };
      sandbox.stub(dataApi, 'get').withArgs('/courts/slug/test-slug/v1').resolves({ data: payload });
      sandbox
        .stub(courtSchema, 'parse')
        .withArgs(payload)
        .returns(parsedCourt as never);

      await expect(requests.getCourtDetails('test-slug')).resolves.toBe(parsedCourt);
    });

    it('returns API status code for axios errors with a response status', async () => {
      sandbox
        .stub(dataApi, 'get')
        .withArgs('/courts/slug/test-slug/v1')
        .rejects({
          isAxiosError: true,
          response: { status: HttpStatusCode.BadGateway },
        });

      await expect(requests.getCourtDetails('test-slug')).resolves.toBe(HttpStatusCode.BadGateway);
    });

    it('returns internal server error for non-axios errors', async () => {
      sandbox.stub(dataApi, 'get').withArgs('/courts/slug/test-slug/v1').rejects(new Error('boom'));

      await expect(requests.getCourtDetails('test-slug')).resolves.toBe(HttpStatusCode.InternalServerError);
    });

    it('returns internal server error for axios errors with no status', async () => {
      sandbox.stub(dataApi, 'get').withArgs('/courts/slug/test-slug/v1').rejects({
        isAxiosError: true,
        response: {},
      });

      await expect(requests.getCourtDetails('test-slug')).resolves.toBe(HttpStatusCode.InternalServerError);
    });
  });

  describe('getAll', () => {
    it('returns parsed combined location details on success', async () => {
      const payload = [
        {
          locationType: 'COURT',
          serviceCentre: false,
          court: {
            ...validCourt,
            courtAddresses: [
              {
                addressLine1: '1 Court Street',
                addressLine2: null,
                townCity: 'London',
                county: null,
                postcode: 'SW1A 1AA',
                epimId: null,
                lat: null,
                lon: null,
                addressType: 'VISIT_US',
                areasOfLaw: null,
                courtTypes: null,
              },
            ],
            courtAreasOfLaw: [
              {
                areasOfLaw: ['area-of-law-id'],
              },
            ],
          },
          serviceCentreDetails: null,
        },
        {
          locationType: 'SERVICE_CENTRE',
          serviceCentre: true,
          court: null,
          serviceCentreDetails: {
            id: 'service-centre-id',
            name: 'Service Centre A',
            slug: 'service-centre-a',
            open: true,
            warningNotice: null,
            createdAt: '2026-06-01T10:00:00Z',
            lastUpdatedAt: '2026-06-02T10:00:00Z',
            serviceAreas: [
              {
                id: 'service-area-id',
                name: 'Divorce',
                nameCy: 'Ysgariad',
                description: null,
                descriptionCy: null,
                onlineUrl: null,
                onlineText: null,
                onlineTextCy: null,
                text: null,
                textCy: null,
                catchmentMethod: 'NATIONAL',
                areaOfLawId: 'area-of-law-id',
                type: 'CIVIL',
                sortOrder: 1,
                hasLocal: false,
                hasNational: true,
                hasRegional: false,
              },
            ],
            catchmentType: CATCHMENT_TYPES.NATIONAL,
            serviceCentreAddresses: [
              {
                id: 'address-id',
                serviceCentreId: 'service-centre-id',
                addressLine1: '1 Service Street',
                addressLine2: null,
                townCity: 'London',
                county: null,
                postcode: 'SW1A 1AA',
                lat: 51.501,
                lon: -0.141,
                addressType: 'WRITE_TO_US',
              },
            ],
            serviceCentreContactDetails: [
              {
                id: 'contact-id',
                serviceCentreId: 'service-centre-id',
                explanation: 'General enquiries',
                explanationCy: null,
                email: 'service@example.com',
                phoneNumber: '0300 123 4567',
                serviceCentreContactDescription: {
                  id: 'description-id',
                  name: 'Enquiries',
                  nameCy: 'Ymholiadau',
                },
              },
            ],
            serviceCentreAreasOfLaw: [
              {
                id: 'service-centre-area-of-law-id',
                serviceCentreId: 'service-centre-id',
                areasOfLaw: [
                  {
                    id: 'area-of-law-id',
                    name: 'Family',
                    nameCy: 'Teulu',
                    externalLink: null,
                    externalLinkCy: null,
                    displayName: 'Family',
                    displayNameCy: 'Teulu',
                  },
                ],
              },
            ],
          },
        },
      ];

      sandbox.stub(dataApi, 'get').withArgs('/all/details.json').resolves({ data: payload });

      await expect(requests.getAll()).resolves.toEqual(payload);
    });

    it('returns API status code for axios errors with response status', async () => {
      sandbox
        .stub(dataApi, 'get')
        .withArgs('/all/details.json')
        .rejects({
          isAxiosError: true,
          response: { status: HttpStatusCode.BadRequest },
        });

      await expect(requests.getAll()).resolves.toBe(HttpStatusCode.BadRequest);
    });

    it('returns internal server error for non-axios errors', async () => {
      sandbox.stub(dataApi, 'get').withArgs('/all/details.json').rejects(new Error('boom'));

      await expect(requests.getAll()).resolves.toBe(HttpStatusCode.InternalServerError);
    });

    it('returns internal server error for axios errors with no status', async () => {
      sandbox.stub(dataApi, 'get').withArgs('/all/details.json').rejects({
        isAxiosError: true,
      });

      await expect(requests.getAll()).resolves.toBe(HttpStatusCode.InternalServerError);
    });
  });

  describe('getByName', () => {
    it('returns parsed search results on success', async () => {
      const payload = [{ name: 'Blackburn Family Court', slug: 'blackburn-family-court' }];
      const query = 'Blackburn';

      sandbox
        .stub(dataApi, 'get')
        .withArgs('search/courts/v1/name', { params: { q: query } })
        .resolves({ data: payload });

      await expect(requests.getByName(query)).resolves.toEqual(payload);
    });

    it('returns API status code for axios errors with response status', async () => {
      const query = 'Blackburn';
      sandbox
        .stub(dataApi, 'get')
        .withArgs('search/courts/v1/name', { params: { q: query } })
        .rejects({
          isAxiosError: true,
          response: { status: HttpStatusCode.BadGateway },
        });

      await expect(requests.getByName(query)).resolves.toBe(HttpStatusCode.BadGateway);
    });

    it('returns internal server error for non-axios errors', async () => {
      const query = 'Blackburn';
      sandbox
        .stub(dataApi, 'get')
        .withArgs('search/courts/v1/name', { params: { q: query } })
        .rejects(new Error('boom'));

      await expect(requests.getByName(query)).resolves.toBe(HttpStatusCode.InternalServerError);
    });

    it('returns internal server error for axios errors with no status', async () => {
      const query = 'Blackburn';
      sandbox
        .stub(dataApi, 'get')
        .withArgs('search/courts/v1/name', { params: { q: query } })
        .rejects({
          isAxiosError: true,
        });

      await expect(requests.getByName(query)).resolves.toBe(HttpStatusCode.InternalServerError);
    });
  });

  describe('getCourtsByPrefix', () => {
    it('returns parsed courts array on success', async () => {
      const payload = [{ raw: 'court-a' }, { raw: 'court-b' }];
      const prefix = 'c';

      sandbox
        .stub(dataApi, 'get')
        .withArgs('/search/courts/v1/prefix', { params: { prefix } })
        .resolves({ data: payload });

      await expect(requests.getCourtsByPrefix(prefix)).resolves.toBe(payload);
    });

    it('returns API status code for axios errors with response status', async () => {
      const prefix = 'c';
      sandbox
        .stub(dataApi, 'get')
        .withArgs('/search/courts/v1/prefix', { params: { prefix } })
        .rejects({
          isAxiosError: true,
          response: { status: HttpStatusCode.NotFound },
        });

      await expect(requests.getCourtsByPrefix(prefix)).resolves.toBe(HttpStatusCode.NotFound);
    });

    it('returns internal server error for non-axios errors', async () => {
      const prefix = 'test';
      sandbox
        .stub(dataApi, 'get')
        .withArgs('/search/courts/v1/prefix', { params: { prefix } })
        .rejects(new Error('boom'));

      await expect(requests.getCourtsByPrefix(prefix)).resolves.toBe(HttpStatusCode.InternalServerError);
    });

    it('returns internal server error for axios errors with no status', async () => {
      const prefix = 'test';
      sandbox.stub(dataApi, 'get').withArgs('/search/courts/v1/prefix', { params: { prefix } }).rejects({
        isAxiosError: true,
      });

      await expect(requests.getCourtsByPrefix(prefix)).resolves.toBe(HttpStatusCode.InternalServerError);
    });
  });

  describe('performPostcodeSearch', () => {
    it('calls the locations endpoint and parses mixed court/service-centre results', async () => {
      const payload = [
        {
          id: 'court-id',
          name: 'Court A',
          slug: 'court-a',
          distance: 1.2,
          type: SEARCH_RESULT_TYPES.COURT,
        },
        {
          id: 'sc-id',
          name: 'Service Centre A',
          slug: 'service-centre-a',
          distance: 2.3,
          type: SEARCH_RESULT_TYPES.SERVICE_CENTRE,
        },
      ];

      sandbox
        .stub(dataApi, 'get')
        .withArgs('/search/locations/v1/postcode', {
          params: {
            postcode: 'SW1A 1AA',
            serviceArea: 'Divorce',
            action: 'NEAREST',
          },
        })
        .resolves({ data: payload });

      await expect(requests.performPostcodeSearch('SW1A 1AA', 'Divorce', 'nearest')).resolves.toEqual(payload);
    });

    it('returns API status code when postcode search request fails with axios status', async () => {
      sandbox
        .stub(dataApi, 'get')
        .withArgs('/search/locations/v1/postcode', {
          params: {
            postcode: 'SW1A 1AA',
            serviceArea: 'Divorce',
            action: 'NEAREST',
          },
        })
        .rejects({
          isAxiosError: true,
          response: { status: HttpStatusCode.BadRequest },
        });

      await expect(requests.performPostcodeSearch('SW1A 1AA', 'Divorce', 'nearest')).resolves.toBe(
        HttpStatusCode.BadRequest
      );
    });
  });

  describe('getServiceAreaSearchResults', () => {
    it('returns parsed service-centre search results on success', async () => {
      const payload = [
        {
          id: 'service-area-result-id',
          serviceCentreId: 'sc-id',
          serviceCentreName: 'National Service Centre',
          serviceCentreSlug: 'national-service-centre',
          serviceAreaIds: ['area-a'],
          catchmentType: CATCHMENT_TYPES.NATIONAL,
          type: SEARCH_RESULT_TYPES.SERVICE_CENTRE,
        },
      ];

      sandbox.stub(dataApi, 'get').withArgs('/search/service-area/v1/Divorce').resolves({ data: payload });

      await expect(requests.getServiceAreaSearchResults('Divorce')).resolves.toEqual(payload);
    });

    it('parses service-centre search results without a catchment type', async () => {
      const payload = [
        {
          id: 'service-area-result-id',
          serviceCentreId: 'sc-id',
          serviceCentreName: 'Service Centre',
          serviceCentreSlug: 'service-centre',
          serviceAreaIds: [],
          catchmentType: null,
          type: SEARCH_RESULT_TYPES.SERVICE_CENTRE,
        },
      ];

      sandbox.stub(dataApi, 'get').withArgs('/search/service-area/v1/Divorce').resolves({ data: payload });

      await expect(requests.getServiceAreaSearchResults('Divorce')).resolves.toEqual(payload);
    });
  });

  describe('getCourtServiceAreas', () => {
    it('keeps backward compatibility by delegating to service area search results', async () => {
      const payload = [
        {
          id: 'service-area-result-id',
          serviceCentreId: 'sc-id',
          serviceCentreName: 'National Service Centre',
          serviceCentreSlug: 'national-service-centre',
          serviceAreaIds: ['area-a'],
          catchmentType: CATCHMENT_TYPES.NATIONAL,
          type: SEARCH_RESULT_TYPES.SERVICE_CENTRE,
        },
      ];

      sandbox.stub(dataApi, 'get').withArgs('/search/service-area/v1/Divorce').resolves({ data: payload });

      await expect(requests.getCourtServiceAreas('Divorce')).resolves.toEqual(payload);
    });
  });
});
