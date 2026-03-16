import { expect } from 'chai';
import request from 'supertest';

import { app } from '../../main/app';

describe('Search option page', () => {
  describe('on GET', () => {
    test('should return search option page', async () => {
      await request(app)
        .get('/search-option')
        .expect(res => {
          expect(res.status).to.equal(200);
          expect(res.text).to.contain('Do you know the name of the court or tribunal?');
        });
    });
  });

  describe('on POST', () => {
    test('should redirect to search-by-name page when knowsLocation is yes', async () => {
      await request(app)
        .post('/search-option')
        .type('form')
        .send({ knowsLocation: 'yes' })
        .expect(res => {
          expect(res.status).to.equal(302);
          expect(res.headers.location).to.equal('/search-by-name');
        });
    });

    test('should redirect to service-choose-action when knowsLocation is no', async () => {
      await request(app)
        .post('/search-option')
        .type('form')
        .send({ knowsLocation: 'no' })
        .expect(res => {
          expect(res.status).to.equal(302);
          expect(res.headers.location).to.equal('/service-choose-action');
        });
    });

    test('should render validation error when knowsLocation is missing', async () => {
      await request(app)
        .post('/search-option')
        .type('form')
        .send({})
        .expect(res => {
          expect(res.status).to.equal(200);
          expect(res.text).to.contain('There is a problem');
          expect(res.text).to.contain('Select if you have the name or not');
        });
    });

    test('should render validation error when knowsLocation is unexpected', async () => {
      await request(app)
        .post('/search-option')
        .type('form')
        .send({ knowsLocation: 'postcode' })
        .expect(res => {
          expect(res.status).to.equal(200);
          expect(res.text).to.contain('There is a problem');
          expect(res.text).to.contain('Select if you have the name or not');
        });
    });
  });
});

describe('Search by name page', () => {
  describe('on GET', () => {
    test('should return search-by-name page', async () => {
      await request(app)
        .get('/search-by-name')
        .expect(res => {
          expect(res.status).to.equal(200);
          expect(res.text).to.contain('Find a Court or Tribunal');
        });
    });
  });
});
