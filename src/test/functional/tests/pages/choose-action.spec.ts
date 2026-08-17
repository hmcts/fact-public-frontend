import cy_i18n from '../../../../main/locales/cy/choose-action.json';
import en_i18n from '../../../../main/locales/en/choose-action.json';
import { expect, test } from '../../fixtures';

test.describe('Choose Action Page', () => {
  test('should render the choose action page', async ({ chooseActionPage }) => {
    await chooseActionPage.goto('en');
    await chooseActionPage.expectHeadingToContainText(en_i18n.question);
    await chooseActionPage.expectVisibleElements();

    await chooseActionPage.goto('cy');
    await chooseActionPage.expectHeadingToContainText(cy_i18n.question);
    await chooseActionPage.expectVisibleElements();
  });

  test('should redirect to the correct service when a valid action is selected', async ({ page, chooseActionPage }) => {
    await chooseActionPage.goto('en');
    await chooseActionPage.selectAction('nearest');
    await chooseActionPage.submit();
    await expect(page).toHaveURL('/services/nearest');
  });

  test('should show error when no action is selected', async ({ chooseActionPage }) => {
    await chooseActionPage.goto('en');
    await chooseActionPage.submit();
    await chooseActionPage.expectErrorSummaryVisible();
    await chooseActionPage.expectMainContentToContainText(en_i18n.error.text);

    await chooseActionPage.goto('cy');
    await chooseActionPage.submit();
    await chooseActionPage.expectErrorSummaryVisible();
    await chooseActionPage.expectMainContentToContainText(cy_i18n.error.text);
  });

  test('should show error when invalid action is submitted', async ({ page, chooseActionPage }) => {
    await chooseActionPage.goto('en');
    // Simulate submitting an invalid action via form
    await page.evaluate(action => {
      const form = document.querySelector('form');
      if (form) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'action';
        input.value = action;
        form.appendChild(input);
      }
    }, 'invalid-action');
    await chooseActionPage.submit();
    await chooseActionPage.expectErrorSummaryVisible();
    await chooseActionPage.expectMainContentToContainText(en_i18n.error.text);
  });
});
