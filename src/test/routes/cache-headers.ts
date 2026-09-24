import { readdirSync } from 'fs';
import * as path from 'path';

import { expect } from 'chai';
import request from 'supertest';

import { app } from '../../main/app';

describe('Cache headers', () => {
  test('does not cache successful dynamic responses and varies them by cookie', async () => {
    await request(app)
      .get('/')
      .expect(res => {
        expect(res.status).to.equal(200);
        expect(res.headers['cache-control']).to.equal('no-store');
        expect(res.headers.vary).to.match(/(?:^|,\s*)Cookie(?:,|$)/);
      });
  });

  test('does not cache not-found responses', async () => {
    await request(app)
      .get('/not-a-real-page')
      .expect(res => {
        expect(res.status).to.equal(404);
        expect(res.headers['cache-control']).to.equal('no-store');
      });
  });

  test('caches fingerprinted static assets as immutable', async () => {
    const publicDirectory = path.join(__dirname, '../../main/public');
    const fingerprintedAsset = readdirSync(publicDirectory).find(fileName => /^main\.[a-f0-9]+\.js$/i.test(fileName));

    expect(fingerprintedAsset).not.to.equal(undefined);

    await request(app)
      .get(`/${fingerprintedAsset}`)
      .expect(200)
      .expect('Cache-Control', 'public, max-age=31536000, immutable')
      .expect(res => expect(res.headers.vary).to.equal(undefined));
  });

  test('requires stable static assets to revalidate', async () => {
    await request(app)
      .get('/assets/manifest.json')
      .expect(200)
      .expect('Cache-Control', 'public, max-age=0, must-revalidate')
      .expect(res => {
        expect(res.headers['cache-control']).not.to.contain('no-store');
        expect(res.headers.vary).to.equal(undefined);
      });
  });
});
