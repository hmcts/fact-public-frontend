import { expect } from 'chai';
import request from 'supertest';

const mockGetByName = jest.fn();

jest.mock('../../main/requests/DataApiRequests', () => ({
  DataApiRequests: jest.fn().mockImplementation(() => ({
    getByName: mockGetByName,
  })),
}));

import { app } from '../../main/app';

describe('Search option page', () => {
  beforeEach(() => {
    mockGetByName.mockReset();
    mockGetByName.mockResolvedValue([]);
  });

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
  beforeEach(() => {
    mockGetByName.mockReset();
    mockGetByName.mockResolvedValue([]);
  });

  describe('on GET', () => {
    test('should return search-by-name page', async () => {
      await request(app)
        .get('/search-by-name')
        .expect(res => {
          expect(res.status).to.equal(200);
          expect(res.text).to.contain('What is the name or address of the court or tribunal?');
        });
    });

    test('should show no results panel when search query is present', async () => {
      mockGetByName.mockResolvedValueOnce([]);
      await request(app)
        .get('/search-by-name?search=Blackburn')
        .expect(res => {
          expect(res.status).to.equal(200);
          expect(res.text).to.contain('There are no matching results.');
        });
    });

    test('should render service error page when search API fails', async () => {
      mockGetByName.mockResolvedValueOnce(500);
      await request(app)
        .get('/search-by-name?search=Blackburn')
        .expect(res => {
          expect(res.status).to.equal(503);
          expect(res.text).to.contain('Something went wrong');
        });
    });
  });

  describe('on POST', () => {
    test('should redirect to GET search page when search is valid', async () => {
      await request(app)
        .post('/search-by-name')
        .type('form')
        .send({ search: 'Blackburn Family Court' })
        .expect(res => {
          expect(res.status).to.equal(302);
          expect(res.headers.location).to.equal('/search-by-name?search=Blackburn%20Family%20Court');
        });
    });

    test('should render validation error when search is blank', async () => {
      await request(app)
        .post('/search-by-name')
        .type('form')
        .send({ search: '' })
        .expect(res => {
          expect(res.status).to.equal(200);
          expect(res.text).to.contain('There is a problem');
          expect(res.text).to.contain('Enter a court name, address, town or city');
        });
    });

    test('should render validation error when search is too short', async () => {
      await request(app)
        .post('/search-by-name')
        .type('form')
        .send({ search: 'ab' })
        .expect(res => {
          expect(res.status).to.equal(200);
          expect(res.text).to.contain('There is a problem');
          expect(res.text).to.contain('Search must be 3 characters or more');
        });
    });
  });
});
