import { HttpStatusCode } from 'axios';
import { type SinonSandbox, createSandbox } from 'sinon';

const mockDataApiLogger = {
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};

jest.mock('@hmcts/nodejs-logging', () => ({
  Logger: {
    getLogger: jest.fn().mockReturnValue(mockDataApiLogger),
  },
}));

import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import { dataApi } from '../../../main/requests/utils/axiosConfig';
import { CATCHMENT_TYPES } from '../../../main/schemas/courtServiceAreas';
import { SEARCH_RESULT_TYPES } from '../../../main/schemas/searchResult';

const validCourt = {
  id: 'acde070d-8c4c-4f0d-9d8a-162843c10333',
  name: 'A Court',
  slug: 'a-court',
  open: true,
  warningNotice: null,
  warningNoticeCy: null,
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

function expectedAxiosError(status: HttpStatusCode, method: string, path: string) {
  return {
    name: 'AxiosError',
    method: method.toUpperCase(),
    requestPath: path,
    message: `Request failed with status code ${status}`,
    status,
  };
}

describe('DataApiRequests', () => {
  let sandbox: SinonSandbox;
  let requests: DataApiRequests;

  beforeEach(() => {
    jest.clearAllMocks();
    sandbox = createSandbox();
    requests = new DataApiRequests();
  });

  afterEach(() => {
    jest.useRealTimers();
    sandbox.restore();
  });

  describe('safeLogging', () => {
    it('logs error details without sensitive information', async () => {
      sandbox
        .stub(dataApi, 'get')
        .withArgs('/courts/slug/test-slug/v1')
        .rejects({
          isAxiosError: true,
          name: 'AxiosError',
          message: 'Request failed with status code 503',
          config: {
            method: 'get',
            url: 'https://data-api.example.test/courts/slug/test-slug/v1',
            headers: {
              Authorization: 'Bearer secret-token',
            },
          },
          response: {
            status: HttpStatusCode.ServiceUnavailable,
            data: {
              'sensitive data': 'should not be logged',
            },
          },
        });

      await expect(requests.getCourtDetails('test-slug')).resolves.toMatchObject({
        status: HttpStatusCode.ServiceUnavailable,
      });

      expect(mockDataApiLogger.error).toHaveBeenCalledWith(
        'Error fetching court details for slug test-slug:',
        expectedAxiosError(HttpStatusCode.ServiceUnavailable, 'GET', '/courts/slug/test-slug/v1')
      );
    });
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

  describe('checkProtectedHealth', () => {
    it('returns true after calling the protected services route with a two-second deadline', async () => {
      const getStub = sandbox.stub(dataApi, 'get').resolves({ data: [] });

      await expect(requests.checkProtectedHealth()).resolves.toBe(true);

      expect(getStub.calledOnce).toBe(true);
      expect(getStub.firstCall.args[0]).toBe('/search/services/v1');
      expect(getStub.firstCall.args[1]).toMatchObject({ timeout: 2_000 });
      expect(getStub.firstCall.args[1]?.signal).toBeInstanceOf(AbortSignal);
    });

    it('returns false when the protected request fails', async () => {
      sandbox.stub(dataApi, 'get').rejects(new Error('authentication failed'));

      await expect(requests.checkProtectedHealth()).resolves.toBe(false);
      expect(mockDataApiLogger.warn).toHaveBeenCalledWith(
        'Protected Data API health check failed:',
        expect.objectContaining({ message: 'authentication failed' })
      );
    });

    it('aborts and returns false when the complete protected check exceeds two seconds', async () => {
      jest.useFakeTimers();
      const getStub = sandbox.stub(dataApi, 'get').returns(new Promise(() => undefined));

      const result = requests.checkProtectedHealth();
      await jest.advanceTimersByTimeAsync(2_000);

      await expect(result).resolves.toBe(false);
      const signal = getStub.firstCall.args[1]?.signal as AbortSignal;
      expect(signal.aborted).toBe(true);
    });
  });

  describe('getCourtDetails', () => {
    it('returns parsed court details on success', async () => {
      const payload = validCourt;
      sandbox.stub(dataApi, 'get').withArgs('/courts/slug/test-slug/v1').resolves({ data: payload });

      await expect(requests.getCourtDetails('test-slug')).resolves.toEqual(payload);
    });

    it('returns API status code for axios errors with a response status', async () => {
      sandbox
        .stub(dataApi, 'get')
        .withArgs('/courts/slug/test-slug/v1')
        .rejects({
          isAxiosError: true,
          response: { status: HttpStatusCode.BadGateway },
        });

      await expect(requests.getCourtDetails('test-slug')).resolves.toMatchObject({ status: HttpStatusCode.BadGateway });
    });

    it.each([HttpStatusCode.BadRequest, HttpStatusCode.NotFound])(
      'preserves contractual public status %s',
      async status => {
        sandbox
          .stub(dataApi, 'get')
          .withArgs('/courts/slug/test-slug/v1')
          .rejects({ isAxiosError: true, response: { status } });

        await expect(requests.getCourtDetails('test-slug')).resolves.toMatchObject({ status });
      }
    );

    it('maps parsing or other local failures to bad gateway', async () => {
      sandbox.stub(dataApi, 'get').withArgs('/courts/slug/test-slug/v1').rejects(new Error('boom'));

      await expect(requests.getCourtDetails('test-slug')).resolves.toMatchObject({ status: HttpStatusCode.BadGateway });
    });

    it('maps axios errors with no response status to service unavailable', async () => {
      sandbox.stub(dataApi, 'get').withArgs('/courts/slug/test-slug/v1').rejects({
        isAxiosError: true,
        response: {},
      });

      await expect(requests.getCourtDetails('test-slug')).resolves.toMatchObject({
        status: HttpStatusCode.ServiceUnavailable,
      });
    });
  });

  describe('getServiceCentreDetails', () => {
    it('calls the slug endpoint and returns parsed service-centre details', async () => {
      const payload = {
        id: 'acde070d-8c4c-4f0d-9d8a-162843c10333',
        name: 'Service Centre A',
        slug: 'service-centre-a',
        open: true,
        warningNotice: null,
        warningNoticeCy: null,
      };
      sandbox.stub(dataApi, 'get').withArgs('/service-centres/slug/test-slug/v1').resolves({ data: payload });

      await expect(requests.getServiceCentreDetails('test-slug')).resolves.toEqual(payload);
    });

    it('parses the Welsh warning notice returned by the slug endpoint', async () => {
      const payload = {
        id: 'acde070d-8c4c-4f0d-9d8a-162843c10333',
        name: 'Test Service Centre',
        slug: 'test-service-centre',
        warningNotice: 'Important service update',
        warningNoticeCy: 'Diweddariad gwasanaeth pwysig',
      };
      sandbox.stub(dataApi, 'get').withArgs('/service-centres/slug/test-service-centre/v1').resolves({ data: payload });

      await expect(requests.getServiceCentreDetails('test-service-centre')).resolves.toEqual(payload);
    });

    it('returns the API status for an axios error', async () => {
      sandbox
        .stub(dataApi, 'get')
        .withArgs('/service-centres/slug/test-slug/v1')
        .rejects({
          isAxiosError: true,
          response: { status: HttpStatusCode.NotFound },
        });

      await expect(requests.getServiceCentreDetails('test-slug')).resolves.toMatchObject({
        status: HttpStatusCode.NotFound,
      });
    });

    it('preserves a contractual bad request response', async () => {
      sandbox
        .stub(dataApi, 'get')
        .withArgs('/service-centres/slug/test-slug/v1')
        .rejects({ isAxiosError: true, response: { status: HttpStatusCode.BadRequest } });

      await expect(requests.getServiceCentreDetails('test-slug')).resolves.toMatchObject({
        status: HttpStatusCode.BadRequest,
      });
    });

    it('maps parsing or non-axios failures to bad gateway', async () => {
      sandbox.stub(dataApi, 'get').withArgs('/service-centres/slug/test-slug/v1').rejects(new Error('boom'));

      await expect(requests.getServiceCentreDetails('test-slug')).resolves.toMatchObject({
        status: HttpStatusCode.BadGateway,
      });
    });

    it('maps axios errors without a response status to service unavailable', async () => {
      sandbox.stub(dataApi, 'get').withArgs('/service-centres/slug/test-slug/v1').rejects({
        isAxiosError: true,
        response: {},
      });

      await expect(requests.getServiceCentreDetails('test-slug')).resolves.toMatchObject({
        status: HttpStatusCode.ServiceUnavailable,
      });
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
                areasOfLaw: ['acde070d-8c4c-4fc4-6789-162843c10333'],
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
            id: 'acde070d-8c4c-4f0d-9d8a-162843c10333',
            name: 'Service Centre A',
            slug: 'service-centre-a',
            open: true,
            warningNotice: null,
            warningNoticeCy: null,
            createdAt: '2026-06-01T10:00:00Z',
            lastUpdatedAt: '2026-06-02T10:00:00Z',
            regionId: 'acde070d-8c4c-4f0d-9d8a-162843c10331',
            serviceAreas: [
              {
                id: 'acde070d-8c4c-4f0d-9d8a-162843c103367',
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
                areaOfLawId: 'acde070d-8c4c-4f0d-6d8a-162843c10333',
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
                id: 'acde070d-8c4c-4f0d-9d8a-162847c10333',
                serviceCentreId: 'acde070d-8c4b-4f0d-9d8a-162843c10333',
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
                id: 'acde070d-8c4c-4c0d-9d8a-162843c10333',
                serviceCentreId: 'acde074d-8c4c-4f0d-9d8a-162843c10333',
                explanation: 'General enquiries',
                explanationCy: null,
                email: 'service@example.com',
                phoneNumber: '0300 123 4567',
                serviceCentreContactDescription: {
                  id: 'acde070d-8c4c-4f0d-9d8a-162743c10333',
                  name: 'Enquiries',
                  nameCy: 'Ymholiadau',
                },
              },
            ],
            serviceCentreAreasOfLaw: [
              {
                id: 'acde070d-8c6c-4f0d-9d8a-162843c10333',
                serviceCentreId: 'acde074d-8c4c-4f0d-9d8a-162843c10333',
                areasOfLaw: [
                  {
                    id: 'acde075d-8c4c-4f0d-9d8a-162843c10333',
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

      await expect(requests.getAll()).resolves.toMatchObject({ status: HttpStatusCode.BadGateway });
    });

    it('returns internal server error for non-axios errors', async () => {
      sandbox.stub(dataApi, 'get').withArgs('/all/details.json').rejects(new Error('boom'));

      await expect(requests.getAll()).resolves.toMatchObject({ status: HttpStatusCode.BadGateway });
    });

    it('returns internal server error for axios errors with no status', async () => {
      sandbox.stub(dataApi, 'get').withArgs('/all/details.json').rejects({
        isAxiosError: true,
      });

      await expect(requests.getAll()).resolves.toMatchObject({ status: HttpStatusCode.ServiceUnavailable });
    });
  });

  describe('getByName', () => {
    it('returns parsed search results on success', async () => {
      const payload = [
        {
          id: 'acde570d-8c4c-4f0d-9d8a-162843c10333',
          name: 'Blackburn Family Court',
          slug: 'blackburn-family-court',
          open: true,
          warningNotice: null,
          warningNoticeCy: null,
          createdAt: '2026-09-28T15:27:30.908Z',
          lastUpdatedAt: '2026-09-28T15:27:30.908Z',
          openOnCath: true,
          mrdId: null,
          regionId: 'acde770d-8c4c-4f0d-9d8a-162873c10333',
          locationType: 'COURT',
          serviceCentre: false,
        },
        {
          id: 'acde075d-8c4c-4f0d-9b8a-162843c10333',
          name: 'Blackburn Service Centre',
          slug: 'blackburn-service-centre',
          open: true,
          warningNotice: null,
          warningNoticeCy: null,
          createdAt: '2026-09-28T15:27:30.908Z',
          lastUpdatedAt: '2026-09-28T15:27:30.908Z',
          openOnCath: true,
          mrdId: null,
          regionId: 'acde075d-8c4c-4f0d-9d8a-162823c10333',
          locationType: 'SERVICE_CENTRE',
          serviceCentre: true,
        },
      ];
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

      await expect(requests.getByName(query)).resolves.toMatchObject({ status: HttpStatusCode.BadGateway });
    });

    it('returns internal server error for non-axios errors', async () => {
      const query = 'Blackburn';
      sandbox
        .stub(dataApi, 'get')
        .withArgs('search/courts/v1/name', { params: { q: query } })
        .rejects(new Error('boom'));

      await expect(requests.getByName(query)).resolves.toMatchObject({ status: HttpStatusCode.BadGateway });
    });

    it('returns internal server error for axios errors with no status', async () => {
      const query = 'Blackburn';
      sandbox
        .stub(dataApi, 'get')
        .withArgs('search/courts/v1/name', { params: { q: query } })
        .rejects({
          isAxiosError: true,
        });

      await expect(requests.getByName(query)).resolves.toMatchObject({ status: HttpStatusCode.ServiceUnavailable });
    });
  });

  describe('getCourtsByPrefix', () => {
    it('parses the real AllLocation response shape on success', async () => {
      const payload = [
        {
          id: 'acd207cd-8c4c-4f4d-9d8a-162843c10333',
          name: 'Court A',
          slug: 'court-a',
          open: true,
          warningNotice: null,
          warningNoticeCy: null,
          lastUpdatedAt: '2026-09-21',
          openOnCath: null,
          mrdId: null,
          regionId: 'acde079d-8c4c-4f0d-9d8a-163843c10333',
          locationType: 'COURT',
          serviceCentre: false,
        },
      ];
      const prefix = 'c';

      sandbox
        .stub(dataApi, 'get')
        .withArgs('/search/courts/v1/prefix', { params: { prefix } })
        .resolves({ data: payload });

      await expect(requests.getCourtsByPrefix(prefix)).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'acd207cd-8c4c-4f4d-9d8a-162843c10333',
            name: 'Court A',
            slug: 'court-a',
            regionId: 'acde079d-8c4c-4f0d-9d8a-163843c10333',
            locationType: 'COURT',
            serviceCentre: false,
          }),
        ])
      );
    });

    it('maps an invalid prefix-search response to bad gateway', async () => {
      const prefix = 'c';
      sandbox
        .stub(dataApi, 'get')
        .withArgs('/search/courts/v1/prefix', { params: { prefix } })
        .resolves({ data: [{ raw: 'invalid' }] });

      await expect(requests.getCourtsByPrefix(prefix)).resolves.toMatchObject({
        status: HttpStatusCode.BadGateway,
      });
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

      await expect(requests.getCourtsByPrefix(prefix)).resolves.toMatchObject({ status: HttpStatusCode.BadGateway });
    });

    it('returns internal server error for non-axios errors', async () => {
      const prefix = 'test';
      sandbox
        .stub(dataApi, 'get')
        .withArgs('/search/courts/v1/prefix', { params: { prefix } })
        .rejects(new Error('boom'));

      await expect(requests.getCourtsByPrefix(prefix)).resolves.toMatchObject({ status: HttpStatusCode.BadGateway });
    });

    it('returns internal server error for axios errors with no status', async () => {
      const prefix = 'test';
      sandbox.stub(dataApi, 'get').withArgs('/search/courts/v1/prefix', { params: { prefix } }).rejects({
        isAxiosError: true,
      });

      await expect(requests.getCourtsByPrefix(prefix)).resolves.toMatchObject({
        status: HttpStatusCode.ServiceUnavailable,
      });
    });
  });

  describe('performPostcodeSearch', () => {
    it('calls the locations endpoint and parses mixed court/service-centre results', async () => {
      const payload = [
        {
          id: 'acde070d-8c4c-4f0d-9d8a-162843c10234',
          name: 'Court A',
          slug: 'court-a',
          distance: 1.2,
          type: SEARCH_RESULT_TYPES.COURT,
        },
        {
          id: 'acde070d-8c4c-4f0d-9d3a-162843c10003',
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

      await expect(requests.performPostcodeSearch('SW1A 1AA', 'Divorce', 'nearest')).resolves.toMatchObject({
        status: HttpStatusCode.BadRequest,
      });
    });

    it('preserves a genuine missing service-area response', async () => {
      sandbox
        .stub(dataApi, 'get')
        .withArgs('/search/locations/v1/postcode', {
          params: {
            postcode: 'SW1A 1AA',
            serviceArea: 'Missing area',
            action: 'NEAREST',
          },
        })
        .rejects({ isAxiosError: true, response: { status: HttpStatusCode.NotFound } });

      await expect(requests.performPostcodeSearch('SW1A 1AA', 'Missing area', 'nearest')).resolves.toMatchObject({
        status: HttpStatusCode.NotFound,
      });
    });

    it('returns service unavailable when postcode search receives no upstream response', async () => {
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
          response: {},
        });

      await expect(requests.performPostcodeSearch('SW1A 1AA', 'Divorce', 'nearest')).resolves.toMatchObject({
        status: HttpStatusCode.ServiceUnavailable,
      });
    });

    it('returns bad gateway when postcode response parsing fails', async () => {
      sandbox
        .stub(dataApi, 'get')
        .withArgs('/search/locations/v1/postcode', {
          params: {
            postcode: 'SW1A 1AA',
            serviceArea: 'Divorce',
            action: 'NEAREST',
          },
        })
        .rejects(new Error('boom'));

      await expect(requests.performPostcodeSearch('SW1A 1AA', 'Divorce', 'nearest')).resolves.toMatchObject({
        status: HttpStatusCode.BadGateway,
      });
    });

    it('maps invalid discriminated-union payload to bad gateway', async () => {
      sandbox
        .stub(dataApi, 'get')
        .withArgs('/search/locations/v1/postcode', {
          params: {
            postcode: 'SW1A 1AA',
            serviceArea: 'Divorce',
            action: 'NEAREST',
          },
        })
        .resolves({
          data: [
            {
              id: 'acde570d-8c4c-4f0d-9d8a-162843c40333',
              name: 'Invalid Location',
              slug: 'invalid-location',
              distance: 1.2,
              type: 'UNKNOWN',
            },
          ],
        });

      await expect(requests.performPostcodeSearch('SW1A 1AA', 'Divorce', 'nearest')).resolves.toMatchObject({
        status: HttpStatusCode.BadGateway,
      });
    });

    it('parses a SERVICE_CENTRE result', async () => {
      const payload = [
        {
          id: 'acde070d-8c4c-4f0d-9d8a-162843c10333',
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
  });

  describe('performPostcodeOnlySearch', () => {
    it('calls postcode-only endpoint and parses results', async () => {
      const payload = [
        {
          courtName: 'Court A',
          courtSlug: 'court-a',
          courtId: 'acde070d-1c4c-1f0d-9d8a-162843c10333',
          distance: 1.1,
        },
      ];

      sandbox
        .stub(dataApi, 'get')
        .withArgs('/search/courts/v1/postcode', {
          params: {
            postcode: 'SW1A 1AA',
          },
        })
        .resolves({ data: payload });

      await expect(requests.performPostcodeOnlySearch('SW1A 1AA')).resolves.toEqual(payload);
    });

    it('returns API status code for postcode-only axios errors with response status', async () => {
      sandbox
        .stub(dataApi, 'get')
        .withArgs('/search/courts/v1/postcode', {
          params: {
            postcode: 'SW1A 1AA',
          },
        })
        .rejects({
          isAxiosError: true,
          response: { status: HttpStatusCode.BadGateway },
        });

      await expect(requests.performPostcodeOnlySearch('SW1A 1AA')).resolves.toMatchObject({
        status: HttpStatusCode.BadGateway,
      });
    });

    it('returns internal server error for postcode-only non-axios failures', async () => {
      sandbox
        .stub(dataApi, 'get')
        .withArgs('/search/courts/v1/postcode', {
          params: {
            postcode: 'SW1A 1AA',
          },
        })
        .rejects(new Error('boom'));

      await expect(requests.performPostcodeOnlySearch('SW1A 1AA')).resolves.toMatchObject({
        status: HttpStatusCode.BadGateway,
      });
    });
  });

  describe('getAllServices', () => {
    it('returns parsed services on success', async () => {
      const payload = [
        {
          id: 'acde070d-8c4c-4f0d-9d8a-162843c10111',
          name: 'Adoption',
          nameCy: 'Mabwysiadu',
          description: null,
          descriptionCy: null,
          serviceAreas: ['area-a'],
        },
      ];

      sandbox.stub(dataApi, 'get').withArgs('/search/services/v1').resolves({ data: payload });

      await expect(requests.getAllServices()).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'acde070d-8c4c-4f0d-9d8a-162843c10222',
            name: 'Adoption',
            slug: 'adoption',
          }),
        ])
      );
    });

    it('returns API status code for axios errors with response status', async () => {
      sandbox
        .stub(dataApi, 'get')
        .withArgs('/search/services/v1')
        .rejects({
          isAxiosError: true,
          response: { status: HttpStatusCode.BadRequest },
        });

      await expect(requests.getAllServices()).resolves.toMatchObject({ status: HttpStatusCode.BadGateway });
    });

    it('returns internal server error for non-axios failures', async () => {
      sandbox.stub(dataApi, 'get').withArgs('/search/services/v1').rejects(new Error('boom'));

      await expect(requests.getAllServices()).resolves.toMatchObject({ status: HttpStatusCode.BadGateway });
    });
  });

  describe('getServiceAreas', () => {
    it('returns parsed service areas on success', async () => {
      const payload = [
        {
          id: 'acde072d-8c4c-4f0d-9d8a-332843c10333',
          name: 'Children, Family Law',
          nameCy: 'Cyfraith Teulu',
          description: null,
          descriptionCy: null,
          onlineUrl: null,
          onlineText: null,
          onlineTextCy: null,
          text: null,
          textCy: null,
          catchmentMethod: 'POSTCODE',
          areaOfLawId: 'acde070d-8c4c-4f0d-9d8a-162843c10666',
          type: 'FAMILY',
          sortOrder: 1,
          hasLocal: true,
          hasNational: false,
          hasRegional: false,
        },
      ];

      sandbox.stub(dataApi, 'get').withArgs('/search/services/v1/Adoption/service-areas').resolves({ data: payload });

      await expect(requests.getServiceAreas('Adoption')).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'area-id',
            slug: 'children-family-law',
          }),
        ])
      );
    });

    it('returns API status code for service-area axios errors with response status', async () => {
      sandbox
        .stub(dataApi, 'get')
        .withArgs('/search/services/v1/Adoption/service-areas')
        .rejects({
          isAxiosError: true,
          response: { status: HttpStatusCode.NotFound },
        });

      await expect(requests.getServiceAreas('Adoption')).resolves.toMatchObject({ status: HttpStatusCode.NotFound });
    });

    it('preserves a contractual bad request response', async () => {
      sandbox
        .stub(dataApi, 'get')
        .withArgs('/search/services/v1/Adoption/service-areas')
        .rejects({ isAxiosError: true, response: { status: HttpStatusCode.BadRequest } });

      await expect(requests.getServiceAreas('Adoption')).resolves.toMatchObject({
        status: HttpStatusCode.BadRequest,
      });
    });

    it('returns internal server error for service-area non-axios failures', async () => {
      sandbox.stub(dataApi, 'get').withArgs('/search/services/v1/Adoption/service-areas').rejects(new Error('boom'));

      await expect(requests.getServiceAreas('Adoption')).resolves.toMatchObject({ status: HttpStatusCode.BadGateway });
    });
  });

  describe('getServiceAreaSearchResults', () => {
    it('returns parsed service-centre search results on success', async () => {
      const payload = [
        {
          id: 'acde220d-8c4c-4f0d-9d8a-162843c10333',
          serviceCentreId: 'acde070d-8c4c-4f0d-9d8a-332843c10888',
          serviceCentreName: 'National Service Centre',
          serviceCentreSlug: 'national-service-centre',
          serviceAreaIds: ['acde070d-8c4c-4f0d-1111-162843c10333'],
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
          id: 'acde070d-8c4c-4f0d-9d8a-162843c10777',
          serviceCentreId: 'acde070d-8c4c-4f0d-777-162843c10999',
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

    it('returns API status code when service-area lookup fails with axios status', async () => {
      sandbox
        .stub(dataApi, 'get')
        .withArgs('/search/service-area/v1/Divorce')
        .rejects({
          isAxiosError: true,
          response: { status: HttpStatusCode.BadGateway },
        });

      await expect(requests.getServiceAreaSearchResults('Divorce')).resolves.toMatchObject({
        status: HttpStatusCode.BadGateway,
      });
    });

    it.each([HttpStatusCode.BadRequest, HttpStatusCode.NotFound])(
      'preserves contractual public status %s',
      async status => {
        sandbox
          .stub(dataApi, 'get')
          .withArgs('/search/service-area/v1/Divorce')
          .rejects({ isAxiosError: true, response: { status } });

        await expect(requests.getServiceAreaSearchResults('Divorce')).resolves.toMatchObject({ status });
      }
    );

    it('returns internal server error when service-area lookup fails with non-axios error', async () => {
      sandbox.stub(dataApi, 'get').withArgs('/search/service-area/v1/Divorce').rejects(new Error('boom'));

      await expect(requests.getServiceAreaSearchResults('Divorce')).resolves.toMatchObject({
        status: HttpStatusCode.BadGateway,
      });
    });
  });

  describe('getCourtServiceAreas', () => {
    it('keeps backward compatibility by delegating to service area search results', async () => {
      const payload = [
        {
          id: 'acde070d-8c4c-4f0d-9d8a-162843c10638',
          serviceCentreId: 'acde070d-8c4c-4f0d-9d8a-162843c10562',
          serviceCentreName: 'National Service Centre',
          serviceCentreSlug: 'national-service-centre',
          serviceAreaIds: ['acde070d-8c4c-4f0d-9d8a-162843c10734'],
          catchmentType: CATCHMENT_TYPES.NATIONAL,
          type: SEARCH_RESULT_TYPES.SERVICE_CENTRE,
        },
      ];

      sandbox.stub(dataApi, 'get').withArgs('/search/service-area/v1/Divorce').resolves({ data: payload });

      await expect(requests.getCourtServiceAreas('Divorce')).resolves.toEqual(payload);
    });
  });

  describe('getFileStream', () => {
    const location = '/resources/v1/court-photo/11111111-1111-4111-8111-111111111111';
    const requestConfig = { responseType: 'stream' as const };

    it('returns the stream and supported response headers', async () => {
      const stream = { pipe: jest.fn() };
      sandbox
        .stub(dataApi, 'get')
        .withArgs(location, requestConfig)
        .resolves({
          data: stream,
          headers: {
            'content-type': 'image/jpeg',
            'content-disposition': 'inline; filename="court.jpg"',
            'content-length': '1234',
          },
        });

      await expect(requests.getFileStream(location, { notFound: true })).resolves.toEqual({
        stream,
        headers: {
          contentType: 'image/jpeg',
          contentDisposition: 'inline; filename="court.jpg"',
          contentLength: '1234',
        },
      });
    });

    it('maps a missing court image to not found when the endpoint opts into that contract', async () => {
      sandbox
        .stub(dataApi, 'get')
        .withArgs(location, requestConfig)
        .rejects({ isAxiosError: true, response: { status: HttpStatusCode.NotFound } });

      await expect(requests.getFileStream(location, { notFound: true })).resolves.toMatchObject({
        status: HttpStatusCode.NotFound,
      });
    });

    it('maps a missing CSV to not found when the endpoint opts into that contract', async () => {
      const csvLocation = '/resources/v1/csv';
      sandbox
        .stub(dataApi, 'get')
        .withArgs(csvLocation, requestConfig)
        .rejects({ isAxiosError: true, response: { status: HttpStatusCode.NotFound } });

      await expect(requests.getFileStream(csvLocation, { notFound: true })).resolves.toMatchObject({
        status: HttpStatusCode.NotFound,
      });
    });

    it('maps a transport failure to service unavailable', async () => {
      sandbox.stub(dataApi, 'get').withArgs(location, requestConfig).rejects({ isAxiosError: true });

      await expect(requests.getFileStream(location)).resolves.toMatchObject({
        status: HttpStatusCode.ServiceUnavailable,
      });
    });

    it('does not expose an upstream authentication failure', async () => {
      sandbox
        .stub(dataApi, 'get')
        .withArgs(location, requestConfig)
        .rejects({ isAxiosError: true, response: { status: HttpStatusCode.Unauthorized } });

      await expect(requests.getFileStream(location)).resolves.toMatchObject({
        status: HttpStatusCode.BadGateway,
      });
    });
  });
});
