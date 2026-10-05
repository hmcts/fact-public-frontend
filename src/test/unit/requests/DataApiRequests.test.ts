import { HttpStatusCode } from 'axios';
import appConfig from 'config';
import { type SinonSandbox, createSandbox, match } from 'sinon';
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
import { requestCache } from '../../../main/requests/utils/RequestCache';
import { dataApi } from '../../../main/requests/utils/axiosConfig';
import { CATCHMENT_TYPES } from '../../../main/schemas/courtServiceAreas';
import { SEARCH_RESULT_TYPES } from '../../../main/schemas/searchResult';

const validCourt = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'A Court',
  slug: 'a-court',
  open: true,
  warningNotice: null,
  warningNoticeCy: null,
  lastUpdatedAt: '2026-05-15T10:35:21.675Z',
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

function expectedRequestConfig(config: object) {
  return match({
    ...config,
    signal: match.instanceOf(AbortSignal),
    timeout: 10_000,
  });
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
    requestCache.clear();
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

  describe('response caching', () => {
    const searchPayload = [
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Blackburn Family Court',
        slug: 'blackburn-family-court',
        open: true,
        warningNotice: null,
        warningNoticeCy: null,
        lastUpdatedAt: '2026-09-28T15:27:30.908Z',
        openOnCath: true,
        mrdId: null,
        regionId: '22222222-2222-4222-8222-222222222222',
        locationType: 'COURT',
        serviceCentre: false,
      },
    ];
    const servicesPayload = [
      {
        id: '33333333-3333-4333-8333-333333333333',
        name: 'Adoption',
        nameCy: 'Mabwysiadu',
        description: null,
        descriptionCy: null,
        serviceAreas: ['area-a'],
      },
    ];

    it('reuses an admin response until its TTL expires', async () => {
      jest.useFakeTimers();
      const getStub = sandbox.stub(dataApi, 'get').resolves({ data: searchPayload });

      await expect(requests.getByName('Blackburn')).resolves.toEqual(searchPayload);
      await expect(requests.getByName('Blackburn')).resolves.toEqual(searchPayload);
      expect(getStub.calledOnce).toBe(true);

      await jest.advanceTimersByTimeAsync(Number(appConfig.get('dataApiCache.adminTtlMs')));

      await expect(requests.getByName('Blackburn')).resolves.toEqual(searchPayload);
      expect(getStub.callCount).toBe(2);
    });

    it('applies the longer reference TTL independently', async () => {
      jest.useFakeTimers();
      const adminTtlMs = Number(appConfig.get('dataApiCache.adminTtlMs'));
      const referenceTtlMs = Number(appConfig.get('dataApiCache.referenceTtlMs'));
      const getStub = sandbox.stub(dataApi, 'get').resolves({ data: servicesPayload });

      await expect(requests.getAllServices()).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: '33333333-3333-4333-8333-333333333333', slug: 'adoption' }),
        ])
      );

      await jest.advanceTimersByTimeAsync(adminTtlMs);
      await requests.getAllServices();
      expect(getStub.calledOnce).toBe(true);

      await jest.advanceTimersByTimeAsync(referenceTtlMs - adminTtlMs);
      await requests.getAllServices();
      expect(getStub.callCount).toBe(2);
    });

    it('coalesces concurrent requests for the same resource', async () => {
      let resolveRequest: ((value: { data: typeof searchPayload }) => void) | undefined;
      const pendingResponse = new Promise<{ data: typeof searchPayload }>(resolve => {
        resolveRequest = resolve;
      });
      const getStub = sandbox.stub(dataApi, 'get').returns(pendingResponse);

      const firstRequest = requests.getByName('Blackburn');
      const secondRequest = requests.getByName('Blackburn');

      expect(getStub.calledOnce).toBe(true);
      resolveRequest?.({ data: searchPayload });

      await expect(Promise.all([firstRequest, secondRequest])).resolves.toEqual([searchPayload, searchPayload]);
    });

    it('does not retain failed requests', async () => {
      const getStub = sandbox.stub(dataApi, 'get');
      getStub.onFirstCall().rejects(new Error('temporary failure'));
      getStub.onSecondCall().resolves({ data: searchPayload });

      await expect(requests.getByName('Blackburn')).resolves.toMatchObject({ status: HttpStatusCode.BadGateway });
      await expect(requests.getByName('Blackburn')).resolves.toEqual(searchPayload);

      expect(getStub.callCount).toBe(2);
    });

    it('does not cache responses that fail schema parsing', async () => {
      const getStub = sandbox.stub(dataApi, 'get');

      getStub.onFirstCall().resolves({
        data: [{ invalid: true }],
      });
      getStub.onSecondCall().resolves({
        data: searchPayload,
      });

      await expect(requests.getByName('Blackburn')).resolves.toMatchObject({
        status: HttpStatusCode.BadGateway,
      });

      await expect(requests.getByName('Blackburn')).resolves.toEqual(searchPayload);

      // Successful response should now be cached.
      await expect(requests.getByName('Blackburn')).resolves.toEqual(searchPayload);

      expect(getStub.callCount).toBe(2);
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

    it('aborts and returns false when the default ten-second deadline is exceeded', async () => {
      jest.useFakeTimers();
      const getStub = sandbox.stub(dataApi, 'get').returns(new Promise(() => undefined));

      const result = requests.checkHealth();
      const signal = getStub.firstCall.args[1]?.signal as AbortSignal;

      await jest.advanceTimersByTimeAsync(9_999);
      expect(signal.aborted).toBe(false);

      await jest.advanceTimersByTimeAsync(1);
      await expect(result).resolves.toBe(false);
      expect(signal.aborted).toBe(true);
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
        id: '11111111-4111-1111-8111-111111111111',
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
        id: '11111111-1111-4111-8111-111111111111',
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
                areasOfLaw: ['11111111-1111-4111-9111-111111111111'],
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
            id: '11111111-1111-4111-8111-111111111111',
            name: 'Service Centre A',
            slug: 'service-centre-a',
            open: true,
            warningNotice: null,
            warningNoticeCy: null,
            createdAt: '2026-06-01T10:00:00Z',
            lastUpdatedAt: '2026-06-02T10:00:00Z',
            regionId: '55555555-5555-4555-8555-555555555555',
            serviceAreas: [
              {
                id: '66666666-6666-4666-8666-666666666666',
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
                areaOfLawId: '77777777-7777-4777-8777-777777777777',
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
                id: '22222222-2222-4222-8222-822222222222',
                serviceCentreId: '33333333-3333-4333-8333-333333333333',
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
                id: '66666666-6666-4666-8666-666666666666',
                serviceCentreId: '44444444-4444-4444-8444-444444444444',
                explanation: 'General enquiries',
                explanationCy: null,
                email: 'service@example.com',
                phoneNumber: '0300 123 4567',
                serviceCentreContactDescription: {
                  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                  name: 'Enquiries',
                  nameCy: 'Ymholiadau',
                },
              },
            ],
            serviceCentreAreasOfLaw: [
              {
                id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
                serviceCentreId: '32323232-3232-4232-8232-323232323232',
                areasOfLaw: [
                  {
                    id: '99999999-9999-4999-8999-999999999999',
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
          id: '11111111-1111-1111-8111-111111111111',
          name: 'Blackburn Family Court',
          slug: 'blackburn-family-court',
          open: true,
          warningNotice: null,
          warningNoticeCy: null,
          createdAt: '2026-09-28T15:27:30.908Z',
          lastUpdatedAt: '2026-09-28T15:27:30.908Z',
          openOnCath: true,
          mrdId: null,
          regionId: '22222222-2222-4222-8222-222222222222',
          locationType: 'COURT',
          serviceCentre: false,
        },
        {
          id: '33333333-3333-4333-8333-333333333333',
          name: 'Blackburn Service Centre',
          slug: 'blackburn-service-centre',
          open: true,
          warningNotice: null,
          warningNoticeCy: null,
          createdAt: '2026-09-28T15:27:30.908Z',
          lastUpdatedAt: '2026-09-28T15:27:30.908Z',
          openOnCath: true,
          mrdId: null,
          regionId: '33333333-3333-4333-8333-333333333333',
          locationType: 'SERVICE_CENTRE',
          serviceCentre: true,
        },
      ];
      const query = 'Blackburn';

      sandbox
        .stub(dataApi, 'get')
        .withArgs('search/courts/v1/name', expectedRequestConfig({ params: { q: query } }))
        .resolves({ data: payload });

      await expect(requests.getByName(query)).resolves.toEqual(payload);
    });

    it('returns API status code for axios errors with response status', async () => {
      const query = 'Blackburn';
      sandbox
        .stub(dataApi, 'get')
        .withArgs('search/courts/v1/name', expectedRequestConfig({ params: { q: query } }))
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
        .withArgs('search/courts/v1/name', expectedRequestConfig({ params: { q: query } }))
        .rejects(new Error('boom'));

      await expect(requests.getByName(query)).resolves.toMatchObject({ status: HttpStatusCode.BadGateway });
    });

    it('returns internal server error for axios errors with no status', async () => {
      const query = 'Blackburn';
      sandbox
        .stub(dataApi, 'get')
        .withArgs('search/courts/v1/name', expectedRequestConfig({ params: { q: query } }))
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
          id: '11111111-1111-4111-8111-111111111111',
          name: 'Court A',
          slug: 'court-a',
          open: true,
          warningNotice: null,
          warningNoticeCy: null,
          lastUpdatedAt: '2026-09-21T10:35:21.675Z',
          openOnCath: null,
          mrdId: null,
          regionId: '11111111-1111-4111-8111-111111111111',
          locationType: 'COURT',
          serviceCentre: false,
        },
      ];
      const prefix = 'c';

      sandbox
        .stub(dataApi, 'get')
        .withArgs('/search/courts/v1/prefix', expectedRequestConfig({ params: { prefix } }))
        .resolves({ data: payload });

      await expect(requests.getCourtsByPrefix(prefix)).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: '11111111-1111-4111-8111-111111111111',
            name: 'Court A',
            slug: 'court-a',
            regionId: '11111111-1111-4111-8111-111111111111',
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
        .withArgs('/search/courts/v1/prefix', expectedRequestConfig({ params: { prefix } }))
        .resolves({ data: [{ raw: 'invalid' }] });

      await expect(requests.getCourtsByPrefix(prefix)).resolves.toMatchObject({
        status: HttpStatusCode.BadGateway,
      });
    });

    it('returns API status code for axios errors with response status', async () => {
      const prefix = 'c';
      sandbox
        .stub(dataApi, 'get')
        .withArgs('/search/courts/v1/prefix', expectedRequestConfig({ params: { prefix } }))
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
        .withArgs('/search/courts/v1/prefix', expectedRequestConfig({ params: { prefix } }))
        .rejects(new Error('boom'));

      await expect(requests.getCourtsByPrefix(prefix)).resolves.toMatchObject({ status: HttpStatusCode.BadGateway });
    });

    it('returns internal server error for axios errors with no status', async () => {
      const prefix = 'test';
      sandbox
        .stub(dataApi, 'get')
        .withArgs('/search/courts/v1/prefix', expectedRequestConfig({ params: { prefix } }))
        .rejects({
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
          id: '11111111-1111-4111-8111-111111111111',
          name: 'Court A',
          slug: 'court-a',
          distance: 1.2,
          type: SEARCH_RESULT_TYPES.COURT,
        },
        {
          id: '22222222-2222-4222-9222-222222222222',
          name: 'Service Centre A',
          slug: 'service-centre-a',
          distance: 2.3,
          type: SEARCH_RESULT_TYPES.SERVICE_CENTRE,
        },
      ];

      sandbox
        .stub(dataApi, 'get')
        .withArgs(
          '/search/locations/v1/postcode',
          expectedRequestConfig({
            params: {
              postcode: 'SW1A 1AA',
              serviceArea: 'Divorce',
              action: 'NEAREST',
            },
          })
        )
        .resolves({ data: payload });

      await expect(requests.performPostcodeSearch('SW1A 1AA', 'Divorce', 'nearest')).resolves.toEqual(payload);
    });

    it('returns API status code when postcode search request fails with axios status', async () => {
      sandbox
        .stub(dataApi, 'get')
        .withArgs(
          '/search/locations/v1/postcode',
          expectedRequestConfig({
            params: {
              postcode: 'SW1A 1AA',
              serviceArea: 'Divorce',
              action: 'NEAREST',
            },
          })
        )
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
        .withArgs(
          '/search/locations/v1/postcode',
          expectedRequestConfig({
            params: {
              postcode: 'SW1A 1AA',
              serviceArea: 'Missing area',
              action: 'NEAREST',
            },
          })
        )
        .rejects({ isAxiosError: true, response: { status: HttpStatusCode.NotFound } });

      await expect(requests.performPostcodeSearch('SW1A 1AA', 'Missing area', 'nearest')).resolves.toMatchObject({
        status: HttpStatusCode.NotFound,
      });
    });

    it('returns service unavailable when postcode search receives no upstream response', async () => {
      sandbox
        .stub(dataApi, 'get')
        .withArgs(
          '/search/locations/v1/postcode',
          expectedRequestConfig({
            params: {
              postcode: 'SW1A 1AA',
              serviceArea: 'Divorce',
              action: 'NEAREST',
            },
          })
        )
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
        .withArgs(
          '/search/locations/v1/postcode',
          expectedRequestConfig({
            params: {
              postcode: 'SW1A 1AA',
              serviceArea: 'Divorce',
              action: 'NEAREST',
            },
          })
        )
        .rejects(new Error('boom'));

      await expect(requests.performPostcodeSearch('SW1A 1AA', 'Divorce', 'nearest')).resolves.toMatchObject({
        status: HttpStatusCode.BadGateway,
      });
    });

    it('maps invalid discriminated-union payload to bad gateway', async () => {
      sandbox
        .stub(dataApi, 'get')
        .withArgs(
          '/search/locations/v1/postcode',
          expectedRequestConfig({
            params: {
              postcode: 'SW1A 1AA',
              serviceArea: 'Divorce',
              action: 'NEAREST',
            },
          })
        )
        .resolves({
          data: [
            {
              id: '11111111-1111-4111-8111-111111111111',
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
          id: '11111111-1111-4111-8111-111111111111',
          name: 'Service Centre A',
          slug: 'service-centre-a',
          distance: 2.3,
          type: SEARCH_RESULT_TYPES.SERVICE_CENTRE,
        },
      ];

      sandbox
        .stub(dataApi, 'get')
        .withArgs(
          '/search/locations/v1/postcode',
          expectedRequestConfig({
            params: {
              postcode: 'SW1A 1AA',
              serviceArea: 'Divorce',
              action: 'NEAREST',
            },
          })
        )
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
          courtId: '11111111-1111-4111-9111-111111111111',
          distance: 1.1,
        },
      ];

      sandbox
        .stub(dataApi, 'get')
        .withArgs(
          '/search/courts/v1/postcode',
          expectedRequestConfig({
            params: {
              postcode: 'SW1A 1AA',
            },
          })
        )
        .resolves({ data: payload });

      await expect(requests.performPostcodeOnlySearch('SW1A 1AA')).resolves.toEqual(payload);
    });

    it('returns API status code for postcode-only axios errors with response status', async () => {
      sandbox
        .stub(dataApi, 'get')
        .withArgs(
          '/search/courts/v1/postcode',
          expectedRequestConfig({
            params: {
              postcode: 'SW1A 1AA',
            },
          })
        )
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
        .withArgs(
          '/search/courts/v1/postcode',
          expectedRequestConfig({
            params: {
              postcode: 'SW1A 1AA',
            },
          })
        )
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
          id: '11111111-1111-4111-9111-111111111111',
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
            id: '11111111-1111-4111-9111-111111111111',
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
          id: '11111111-1111-4111-9111-111111111111',
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
          areaOfLawId: '11111111-1111-4111-9111-111111111111',
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
            id: '11111111-1111-4111-9111-111111111111',
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
          id: '11111111-1111-4111-9111-111111111111',
          serviceCentreId: '22222222-2222-4222-9222-222222222222',
          serviceCentreName: 'National Service Centre',
          serviceCentreSlug: 'national-service-centre',
          serviceAreaIds: ['33333333-3333-4333-9333-333333333333'],
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
          id: '11111111-1111-4111-9111-111111111111',
          serviceCentreId: '22222222-2222-4222-9222-222222222222',
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
          id: '11111111-1111-4111-9111-111111111111',
          serviceCentreId: '22222222-2222-4222-9222-222222222222',
          serviceCentreName: 'National Service Centre',
          serviceCentreSlug: 'national-service-centre',
          serviceAreaIds: ['33333333-3333-4333-9333-333333333333'],
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
        .withArgs(location, expectedRequestConfig(requestConfig))
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
        .withArgs(location, expectedRequestConfig(requestConfig))
        .rejects({ isAxiosError: true, response: { status: HttpStatusCode.NotFound } });

      await expect(requests.getFileStream(location, { notFound: true })).resolves.toMatchObject({
        status: HttpStatusCode.NotFound,
      });
    });

    it('maps a missing CSV to not found when the endpoint opts into that contract', async () => {
      const csvLocation = '/resources/v1/csv';
      sandbox
        .stub(dataApi, 'get')
        .withArgs(csvLocation, expectedRequestConfig(requestConfig))
        .rejects({ isAxiosError: true, response: { status: HttpStatusCode.NotFound } });

      await expect(requests.getFileStream(csvLocation, { notFound: true })).resolves.toMatchObject({
        status: HttpStatusCode.NotFound,
      });
    });

    it('maps a transport failure to service unavailable', async () => {
      sandbox
        .stub(dataApi, 'get')
        .withArgs(location, expectedRequestConfig(requestConfig))
        .rejects({ isAxiosError: true });

      await expect(requests.getFileStream(location)).resolves.toMatchObject({
        status: HttpStatusCode.ServiceUnavailable,
      });
    });

    it('does not expose an upstream authentication failure', async () => {
      sandbox
        .stub(dataApi, 'get')
        .withArgs(location, expectedRequestConfig(requestConfig))
        .rejects({ isAxiosError: true, response: { status: HttpStatusCode.Unauthorized } });

      await expect(requests.getFileStream(location)).resolves.toMatchObject({
        status: HttpStatusCode.BadGateway,
      });
    });
  });
});
