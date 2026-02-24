import { test } from '@playwright/test';

import { NotFoundPage } from '../page-objects/NotFoundPage';

test.describe('Not Found Page Visual & Language Checks', () => {
  test('should load and display correct content sections (english)', async ({ page }) => {
    const notFoundPage = new NotFoundPage(page);
    await notFoundPage.goto('en');
    await notFoundPage.expectVisibleElements();
    // ensure the language selection has the Welsh/Cymraeg toggle
    await notFoundPage.expectLanguageLinkToContainText('Cymraeg');
  });

  test('should load and display correct content sections (welsh)', async ({ page }) => {
    const notFoundPage = new NotFoundPage(page);
    await notFoundPage.goto('cy');
    await notFoundPage.expectVisibleElements();
    // ensure the language selection has the English toggle
    await notFoundPage.expectLanguageLinkToContainText('English');
  });
});

test.describe('Not Found Page Content Checks', () => {
  test('should have content and show the correct page heading (english)', async ({ page }) => {
    const notFoundPage = new NotFoundPage(page);
    await notFoundPage.goto('en');
    await notFoundPage.expectMainContentToBePopulated();
    await notFoundPage.expectHeadingToContainText('Find a Court or Tribunal');
  });

  test('should have content and show the correct page heading (welsh)', async ({ page }) => {
    const notFoundPage = new NotFoundPage(page);
    await notFoundPage.goto('cy');
    await notFoundPage.expectMainContentToBePopulated();
    await notFoundPage.expectHeadingToContainText('Dod o hyd i lys neu dribiwnlys');
  });
});
