import { test } from '@playwright/test';

import { HomePage } from '../page-objects/HomePage';

test.describe('Home Page Visual & Language Checks', () => {
  test('should load and display correct content sections (english)', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto('en');
    await homePage.expectVisibleElements();
    // ensure the language selection has the Welsh/Cymraeg toggle
    await homePage.expectLanguageLinkToContainText('Cymraeg');
  });

  test('should load and display correct content sections (welsh)', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto('cy');
    await homePage.expectVisibleElements();
    // ensure the language selection has the English toggle
    await homePage.expectLanguageLinkToContainText('English');
  });
});

test.describe('Home Page Content Checks', () => {
  test('should have content and show the correct page heading (english)', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto('en');
    await homePage.expectMainContentToBePopulated();
    await homePage.expectHeadingToContainText(
      'Find a Court or Tribunal'
    );
  });

  test('should have content and show the correct page heading (welsh)', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto('cy');
    await homePage.expectMainContentToBePopulated();
    await homePage.expectHeadingToContainText(
      'Dod o hyd i lys neu dribiwnlys'
    );
  });
});
