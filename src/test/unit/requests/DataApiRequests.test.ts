import { HttpStatusCode } from 'axios';
import sinon from 'sinon';

import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import { dataApi } from '../../../main/requests/utils/axiosConfig';
import { courtSchema } from '../../../main/schemas/courtSchema';

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
  let parseStub: sinon.SinonStub;

  beforeEach(() => {
    sinon.restore();
    getStub = sinon.stub(dataApi, 'get');
    parseStub = sinon.stub(courtSchema, 'parse');
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

  it('returns parsed court details on success', async () => {
    const payload = { some: 'data' };
    const parsed = { id: '1' };
    getStub.withArgs('/courts/slug/test-slug/v1').resolves({ data: payload });
    parseStub.withArgs(payload).returns(parsed);

    const response = await dataApiRequests.getCourtDetails('test-slug');
    expect(response).toBe(parsed);
  });

  it('returns error status when API responds with an error status', async () => {
    getStub.withArgs('/courts/slug/test-slug/v1').rejects({
      isAxiosError: true,
      response: { status: HttpStatusCode.BadGateway },
    });

    const response = await dataApiRequests.getCourtDetails('test-slug');
    expect(response).toBe(HttpStatusCode.BadGateway);
  });

  it('returns internal server error when API error has no status', async () => {
    getStub.withArgs('/courts/slug/test-slug/v1').rejects({ isAxiosError: true });

    const response = await dataApiRequests.getCourtDetails('test-slug');
    expect(response).toBe(HttpStatusCode.InternalServerError);
  });
});
