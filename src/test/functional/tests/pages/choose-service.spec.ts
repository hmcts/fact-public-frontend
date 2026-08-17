import cy_i18n from '../../../../main/locales/cy/choose-service.json';
import en_i18n from '../../../../main/locales/en/choose-service.json';
import { expect, test } from '../../fixtures';

const nearestAction = 'nearest';

test.describe('Choose Service Page', () => {
  test('should render the choose service page', async ({ chooseServicePage }) => {
    await chooseServicePage.goto(nearestAction, 'en');
    await chooseServicePage.expectHeadingToContainText(en_i18n.question);
    await chooseServicePage.expectVisibleElements();

    await chooseServicePage.goto(nearestAction, 'cy');
    await chooseServicePage.expectHeadingToContainText(cy_i18n.question);
    await chooseServicePage.expectVisibleElements();
  });

  test('should redirect to the correct service area when a valid service is selected', async ({
    page,
    chooseServicePage,
  }) => {
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
        // need to deal with the fact that we don't know which service has been selected, and it may
        // go directly to a postcode search when only a single service area is associated.
        await expect(page).toHaveURL(/\/services\/.+\/nearest(\/search-by-postcode\/)?/);
        break;
      }
    }
    expect(found).toBeTruthy();
  });

  test('should redirect to service-not-found when "not-listed" is selected', async ({ page, chooseServicePage }) => {
    await chooseServicePage.goto(nearestAction, 'en');
    await chooseServicePage.selectService('not-listed');
    await chooseServicePage.submit();
    await expect(page).toHaveURL('/service-not-found');
  });

  test('should show error when no service is selected', async ({ chooseServicePage }) => {
    await chooseServicePage.goto(nearestAction, 'en');
    await chooseServicePage.submit();
    await chooseServicePage.expectErrorSummaryVisible();
    await chooseServicePage.expectMainContentToContainText(en_i18n.error.text);

    await chooseServicePage.goto(nearestAction, 'cy');
    await chooseServicePage.submit();
    await chooseServicePage.expectErrorSummaryVisible();
    await chooseServicePage.expectMainContentToContainText(cy_i18n.error.text);
  });

  test('should show 404 when invalid action is submitted', async ({ page, chooseServicePage }) => {
    await chooseServicePage.goto('invalid-action', 'en');
    await expect(page).toHaveURL(/\/services\/invalid-action(\?lng=en)?/);
    await chooseServicePage.expectMainContentToContainText('Not Found');
  });
});
