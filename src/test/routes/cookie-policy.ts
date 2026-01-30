import { expect } from 'chai';
import request from 'supertest';

import { app } from '../../main/app';

describe('Cookie policy page', () => {
  describe('on GET', () => {
    test('should return cookie policy page', async () => {
      await request(app)
        .get('/cookie-policy')
        .expect(res => {
          expect(res.status).to.equal(200);
          expect(res.text).to.contain('Cookie Policy');
        });
    });
  });
});
