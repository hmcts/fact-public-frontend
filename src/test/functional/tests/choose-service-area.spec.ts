import { expect, test } from '@playwright/test';

import { ChooseServiceAreaPage } from '../page-objects/ChooseServiceAreaPage';

test.describe('Choose Service Area Page', () => {
  // TODO: we need a curated set of service->service area data returned by the API be able to
  //       write tests based on expected outcomes. Or we need to write tests that are happy with
  //       a range of outcomes based on the data returned by the API, which is less than ideal.

  test('should show 404 when invalid action is submitted', async ({ page }) => {
    const chooseServiceAreaPage = new ChooseServiceAreaPage(page);
    await chooseServiceAreaPage.goto('not-listed', 'invalid-action', 'en');
    await expect(page).toHaveURL(new RegExp('/services/not-listed/service-areas/invalid-action(\\?lng=en)?'));
    await chooseServiceAreaPage.expectMainContentToContainText('Not Found');
  });
});
