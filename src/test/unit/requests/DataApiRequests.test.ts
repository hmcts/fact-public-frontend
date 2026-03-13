import { Logger } from '@hmcts/nodejs-logging';
import { HttpStatusCode } from 'axios';
import { type SinonSandbox, createSandbox } from 'sinon';

import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import { dataApi } from '../../../main/requests/utils/axiosConfig';
import { courtSchema } from '../../../main/schemas/courtSchema';

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
    it('returns parsed courts array on success', async () => {
      const payload = [{ raw: 'court-a' }];
      const parsedCourts = [{ id: 'a' }];
      const arrayParseStub = sandbox.stub().withArgs(payload).returns(parsedCourts);

      sandbox.stub(dataApi, 'get').withArgs('courts/all.json').resolves({ data: payload });
      sandbox.stub(courtSchema, 'array').returns({ parse: arrayParseStub } as never);

      await expect(requests.getAll()).resolves.toBe(parsedCourts);
    });

    it('returns API status code for axios errors with response status', async () => {
      sandbox
        .stub(dataApi, 'get')
        .withArgs('courts/all.json')
        .rejects({
          isAxiosError: true,
          response: { status: HttpStatusCode.BadRequest },
        });

      await expect(requests.getAll()).resolves.toBe(HttpStatusCode.BadRequest);
    });

    it('returns internal server error for non-axios errors', async () => {
      sandbox.stub(dataApi, 'get').withArgs('courts/all.json').rejects(new Error('boom'));

      await expect(requests.getAll()).resolves.toBe(HttpStatusCode.InternalServerError);
    });

    it('returns internal server error for axios errors with no status', async () => {
      sandbox.stub(dataApi, 'get').withArgs('courts/all.json').rejects({
        isAxiosError: true,
      });

      await expect(requests.getAll()).resolves.toBe(HttpStatusCode.InternalServerError);
    });
  });

  describe('createTestCourt', () => {
    it('returns parsed court details on success', async () => {
      const payload = { raw: 'test-court' };
      const parsedCourt = { id: 'test-id', slug: 'test-slug' };
      sandbox
        .stub(dataApi, 'get')
        .withArgs('/testing-support/courts', {
          params: {
            courtName: 'Test Court',
            serviceCenter: false,
          },
          responseType: 'json',
        })
        .resolves({ data: payload });
      sandbox
        .stub(courtSchema, 'parse')
        .withArgs(payload)
        .returns(parsedCourt as never);

      await expect(requests.createTestCourt('Test Court', false)).resolves.toBe(parsedCourt);
    });

    it('returns API status code for axios errors with a response status', async () => {
      sandbox
        .stub(dataApi, 'get')
        .withArgs('/testing-support/courts', {
          params: {
            courtName: 'Test Court',
            serviceCenter: false,
          },
          responseType: 'json',
        })
        .rejects({
          isAxiosError: true,
          response: { status: HttpStatusCode.Conflict },
        });

      await expect(requests.createTestCourt('Test Court', false)).resolves.toBe(HttpStatusCode.Conflict);
    });

    it('successfully parses string response data', async () => {
      const payload = '{"id": "test-id", "slug": "test-slug"}';
      const parsedCourt = { id: 'test-id', slug: 'test-slug' };
      sandbox
        .stub(dataApi, 'get')
        .withArgs('/testing-support/courts', {
          params: {
            courtName: 'Test Court',
            serviceCenter: false,
          },
          responseType: 'json',
        })
        .resolves({ data: payload });
      sandbox
        .stub(courtSchema, 'parse')
        .withArgs(parsedCourt)
        .returns(parsedCourt as never);

      await expect(requests.createTestCourt('Test Court', false)).resolves.toEqual(parsedCourt);
    });

    it('successfully parses when areasOfLaw in courtAddresses contains strings', async () => {
      const payload = {
        id: 'test-id',
        name: 'Test Court',
        slug: 'test-slug',
        open: true,
        warningNotice: null,
        lastUpdatedAt: '2023-01-01',
        openOnCath: null,
        mrdId: null,
        region: { name: 'Region', country: 'Country' },
        courtDxCodes: [],
        courtCodes: [],
        courtFaxNumbers: [],
        courtAddresses: [
          {
            addressLine1: 'Address 1',
            addressLine2: null,
            townCity: 'Town',
            county: null,
            postcode: 'SW1A 1AA',
            epimId: null,
            lat: null,
            lon: null,
            addressType: 'VISIT_US',
            areasOfLaw: ['Crime'], // String instead of object
            courtTypes: [],
          },
        ],
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

      const expected = {
        ...payload,
        courtAddresses: [
          {
            ...payload.courtAddresses[0],
            areasOfLaw: [
              {
                name: 'Crime',
                nameCy: null,
                externalLink: null,
                externalLinkCy: null,
                displayName: null,
                displayNameCy: null,
              },
            ],
          },
        ],
      };

      sandbox
        .stub(dataApi, 'get')
        .withArgs('/testing-support/courts', {
          params: {
            courtName: 'Test Court',
            serviceCenter: false,
          },
          responseType: 'json',
        })
        .resolves({ data: payload });

      const result = await requests.createTestCourt('Test Court', false);
      expect(result).toEqual(expected);
    });
  });

  describe('deleteCourtsByNamePrefix', () => {
    it('returns success message on success', async () => {
      const prefix = 'Test Court';
      const successMessage = '1 court(s) with prefix Test Court deleted successfully';
      sandbox.stub(dataApi, 'delete').withArgs(`/testing-support/courts/name-prefix/${prefix}`).resolves({ data: successMessage });

      await expect(requests.deleteCourtsByNamePrefix(prefix)).resolves.toBe(successMessage);
    });

    it('returns API status code for axios errors with a response status', async () => {
      const prefix = 'Invalid';
      sandbox
        .stub(dataApi, 'delete')
        .withArgs(`/testing-support/courts/name-prefix/${prefix}`)
        .rejects({
          isAxiosError: true,
          response: { status: HttpStatusCode.BadRequest },
        });

      await expect(requests.deleteCourtsByNamePrefix(prefix)).resolves.toBe(HttpStatusCode.BadRequest);
    });

    it('returns internal server error for non-axios errors', async () => {
      sandbox.stub(dataApi, 'delete').rejects(new Error('boom'));

      await expect(requests.deleteCourtsByNamePrefix('any')).resolves.toBe(HttpStatusCode.InternalServerError);
    });
  });
});
