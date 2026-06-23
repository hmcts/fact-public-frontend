import { expect, test } from '@playwright/test';

import { ServiceCentreTestData, createServiceCentreTestData } from '../helpers/serviceCentreTestData';

test.describe('Service Centre Page', () => {
  let serviceCentreData!: ServiceCentreTestData;

  test.beforeAll(async ({ playwright }) => {
    serviceCentreData = await createServiceCentreTestData(playwright, 'service-centre-page');
  });

  test.afterAll(async () => {
    if (serviceCentreData) {
      await serviceCentreData.cleanup();
    }
  });

  test('should render the placeholder page for a generated service centre slug', async ({ page }) => {
    await page.goto(`/service-centres/${serviceCentreData.defaultServiceCentre.slug}`);
    await expect(page.locator('h1.govuk-heading-l')).toContainText('Coming soon!');
  });
});
