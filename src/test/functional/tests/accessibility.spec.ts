import { expect, test } from '../fixtures';

test.describe('Home page accessibility @a11y', () => {
  test('should have no accessibility violations', async ({ homePage, axeUtils, browserName }) => {
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(browserName !== 'chromium', 'A11y audit runs in Chrome only.');
    await expect(homePage.heading).toBeVisible();
    await axeUtils.audit({
      exclude: ['.govuk-footer__licence-logo', '.govuk-footer__crown'],
    });
  });
});
