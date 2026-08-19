import cy_i18n from '../../../../main/locales/cy/unknown-service.json';
import en_i18n from '../../../../main/locales/en/unknown-service.json';
import { test } from '../../fixtures';

test.describe('Unknown Service Page', () => {
  test('should render the unknown service page', async ({ unknownServicePage }) => {
    await unknownServicePage.goto('en');
    await unknownServicePage.expectHeadingToContainText(en_i18n.h1);
    await unknownServicePage.expectVisibleElements();

    await unknownServicePage.goto('cy');
    await unknownServicePage.expectHeadingToContainText(cy_i18n.h1);
    await unknownServicePage.expectVisibleElements();
  });
});
