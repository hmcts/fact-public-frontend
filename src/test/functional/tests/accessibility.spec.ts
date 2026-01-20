import { Server } from 'http';
import { AddressInfo } from 'net';

import { app } from '../../../main/app';
import { expect, test } from '../fixtures';

let server: Server;
let baseUrl: string;

test.beforeAll(() => {
  server = app.listen(0);
  const address = server.address();
  if (address && typeof address !== 'string') {
    baseUrl = `http://localhost:${(address as AddressInfo).port}`;
  } else {
    throw new Error('Server address is not available');
  }
});

test.afterAll(() => {
  return new Promise<void>((resolve, reject) => {
    server.close(err => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
});

test.describe('Home page accessibility @a11y', () => {
  test('should have no accessibility violations', async ({ page, axeUtils, browserName }) => {
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(browserName !== 'chromium', 'A11y audit runs in Chrome only.');
    await page.goto(`${baseUrl}/`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1.govuk-heading-xl')).toBeVisible();
    await axeUtils.audit({
      exclude: ['.govuk-footer__licence-logo', '.govuk-footer__crown'],
    });
  });
});
