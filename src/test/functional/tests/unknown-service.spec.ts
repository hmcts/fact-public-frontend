import { test } from '@playwright/test';

import cy_i18n from '../../../main/locales/cy/unknown-service.json';
import en_i18n from '../../../main/locales/en/unknown-service.json';
import { UnknownServicePage } from '../page-objects/UnknownServicePage';

test.describe('Unknown Service Page', () => {
  test('should render the unknown service page', async ({ page }) => {
    const chooseActionPage = new UnknownServicePage(page);
    await chooseActionPage.goto('en');
    await chooseActionPage.expectHeadingToContainText(en_i18n.h1);
    await chooseActionPage.expectVisibleElements();

    await chooseActionPage.goto('cy');
    await chooseActionPage.expectHeadingToContainText(cy_i18n.h1);
    await chooseActionPage.expectVisibleElements();
  });
});
