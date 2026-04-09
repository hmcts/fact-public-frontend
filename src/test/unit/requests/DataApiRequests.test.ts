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
});
