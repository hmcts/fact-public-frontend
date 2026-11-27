import request from 'supertest';

import { app } from '../../main/app';
import { oldFrontendProxy } from '../../main/controllers/ProxyController';

const paths = [
  '/v2/proxy/search/slug/cardiff-social-security-and-child-support-tribunal',
  '/v2/proxy/search/court-types/County%20Court,Family',
  '/v2/proxy/search/postcode/SW1A%201AA/serviceArea/divorce',
];

describe('Legacy API relay', () => {
  const get = jest.spyOn(oldFrontendProxy, 'request');

  beforeEach(() => {
    get.mockReset();
  });

  afterAll(() => {
    get.mockRestore();
  });

  test.each(paths)('relays %s with its encoding, query string and upstream response', async path => {
    const url = `${path}?filter=one&filter=two&name=A%26B`;
    const body = '{ "slug": "test-court", "legacyField": true }';
    get.mockResolvedValue({ status: 200, data: Buffer.from(body), headers: { 'content-type': 'application/json' } });

    const response = await request(app)
      .get(url)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    expect(get).toHaveBeenCalledWith({ url, method: 'GET' });
    expect(response.text).toBe(body);
  });

  test.each([400, 404, 429, 500, 503])('preserves upstream %s responses and their bodies', async status => {
    get.mockResolvedValue({
      status,
      data: Buffer.from('{"error":"legacy error"}'),
      headers: { 'content-type': 'application/json', 'retry-after': '60' },
    });

    const response = await request(app).get(paths[0]).expect(status).expect('Retry-After', '60');

    expect(response.body).toEqual({ error: 'legacy error' });
  });

  test('passes redirects back to the client', async () => {
    get.mockResolvedValue({ status: 302, data: Buffer.from(''), headers: { location: '/legacy-target' } });

    const response = await request(app).get(paths[0]).expect(302);

    expect(response.headers.location).toBe('/legacy-target');
  });

  test('supports HEAD without sending a response body', async () => {
    get.mockResolvedValue({ status: 200, data: Buffer.from(''), headers: { 'content-type': 'application/json' } });

    const response = await request(app).head(paths[0]).expect(200);

    expect(get).toHaveBeenCalledWith({ url: paths[0], method: 'HEAD' });
    expect(response.text).toBeUndefined();
  });

  test.each(['connection refused', 'timeout'])('returns 502 for %s', async message => {
    get.mockRejectedValue(new Error(message));

    const response = await request(app).get(paths[0]);

    expect(response.status).toBe(502);
  });

  test('leaves unknown proxy routes unmatched', async () => {
    await request(app).get('/v2/proxy/unknown').expect(404);

    expect(get).not.toHaveBeenCalled();
  });
});
