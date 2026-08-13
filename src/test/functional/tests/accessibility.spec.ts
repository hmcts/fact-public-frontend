import { test } from '../fixtures';
import { ServiceCentreTestData, createServiceCentreTestData } from '../helpers/serviceCentreTestData';

test.describe('Accessibility tests', { tag: '@a11y' }, () => {
  test('Homepage accessibility', async ({ axeUtils, homePage }) => {
    await homePage.goto();
    await axeUtils.audit();
  });

  test('Accessibility statement accessibility', async ({ accessibilityPage, axeUtils }) => {
    await accessibilityPage.goto();
    await axeUtils.audit();
  });

  test('Not-found page accessibility', async ({ axeUtils, notFoundPage }) => {
    await notFoundPage.goto();
    await axeUtils.audit();
  });

  test.describe('Service-centre page accessibility', () => {
    let serviceCentreData: ServiceCentreTestData;

    test.beforeAll(async ({ playwright }) => {
      serviceCentreData = await createServiceCentreTestData(playwright, 'accessibility');
    });

    test.afterAll(async () => {
      await serviceCentreData?.cleanup();
      await serviceCentreData?.apiContext.dispose();
    });

    test('Service-centre details accessibility', async ({ axeUtils, page }) => {
      await page.goto(`/service-centres/${serviceCentreData.defaultServiceCentre.slug}`);
      await axeUtils.audit();
    });
  });
});
