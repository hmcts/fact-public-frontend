import { expect } from 'chai';
import request from 'supertest';

import { app } from '../../main/app';

describe('Service centre routes', () => {
  test('GET /service-centres/:slug renders coming soon page', async () => {
    await request(app)
      .get('/service-centres/test-centre')
      .expect(res => {
        expect(res.status).to.equal(200);
        expect(res.text).to.include('Coming soon!');
      });
  });
});
