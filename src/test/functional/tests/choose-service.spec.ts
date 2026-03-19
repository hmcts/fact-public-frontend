import { expect, test } from '@playwright/test';

import cy_i18n from '../../../main/locales/cy/choose-service.json';
import en_i18n from '../../../main/locales/en/choose-service.json';
import { ChooseServicePage } from '../page-objects/ChooseServicePage';

const nearestAction = 'nearest';

test.describe('Choose Service Page', () => {
  test('should render the choose service page', async ({ page }) => {
    const chooseServicePage = new ChooseServicePage(page);
    await chooseServicePage.goto(nearestAction, 'en');
    await chooseServicePage.expectHeadingToContainText(en_i18n.question);
    await chooseServicePage.expectVisibleElements();

    await chooseServicePage.goto(nearestAction, 'cy');
    await chooseServicePage.expectHeadingToContainText(cy_i18n.question);
    await chooseServicePage.expectVisibleElements();
  });

  test('should redirect to the correct service area when a valid service is selected', async ({ page }) => {
    const chooseServicePage = new ChooseServicePage(page);
    await chooseServicePage.goto(nearestAction, 'en');
    // Find a valid service radio (other than 'not-listed')
    const radios = await page.$$('input[type="radio"]');
    let found = false;
    for (const radio of radios) {
      const value = await radio.getAttribute('value');
      if (value && value !== 'not-listed') {
        await radio.check();
        found = true;
        await chooseServicePage.submit();
        await expect(page).toHaveURL(`/services/${value}/service-areas/${nearestAction}`);
        break;
      }
    }
    expect(found).toBeTruthy();
  });

  test('should redirect to service-not-found when "not-listed" is selected', async ({ page }) => {
    const chooseServicePage = new ChooseServicePage(page);
    await chooseServicePage.goto(nearestAction, 'en');
    await chooseServicePage.selectService('not-listed');
    await chooseServicePage.submit();
    await expect(page).toHaveURL('/service-not-found');
  });

  test('should show error when no service is selected', async ({ page }) => {
    const chooseServicePage = new ChooseServicePage(page);
    await chooseServicePage.goto(nearestAction, 'en');
    await chooseServicePage.submit();
    await chooseServicePage.expectErrorSummaryVisible();
    await chooseServicePage.expectMainContentToContainText(en_i18n.error.text);

    await chooseServicePage.goto(nearestAction, 'cy');
    await chooseServicePage.submit();
    await chooseServicePage.expectErrorSummaryVisible();
    await chooseServicePage.expectMainContentToContainText(cy_i18n.error.text);
  });

  test('should show 404 when invalid action is submitted', async ({ page }) => {
    const chooseServicePage = new ChooseServicePage(page);
    await chooseServicePage.goto('invalid-action', 'en');
    await expect(page).toHaveURL(/\/services\/invalid-action(\?lng=en)?/);
    await chooseServicePage.expectMainContentToContainText('Not Found');
  });
});
