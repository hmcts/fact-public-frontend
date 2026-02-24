import { test } from '@playwright/test';

import { AccessibilityPage } from '../page-objects/AccessibilityPage';
import { HomePage } from '../page-objects/HomePage';

test.describe('Accessibility Page Visual & Language Checks', () => {
  test('should load and display correct content sections (english)', async ({ page }) => {
    const accessibilityPage = new AccessibilityPage(page);
    await accessibilityPage.goto('en');
    await accessibilityPage.expectVisibleElements();
    // ensure the language selection has the Welsh/Cymraeg toggle
    await accessibilityPage.expectLanguageLinkToContainText('Cymraeg');
  });

  test('should load and display correct content sections (welsh)', async ({ page }) => {
    const accessibilityPage = new AccessibilityPage(page);
    await accessibilityPage.goto('cy');
    await accessibilityPage.expectVisibleElements();
    // ensure the language selection has the Welsh/Cymraeg toggle
    await accessibilityPage.expectLanguageLinkToContainText('English');
  });

  test('should maintain preselected language during navigation', async ({ page }) => {
    const homePage = new HomePage(page);
    const accessibilityPage = new AccessibilityPage(page);
    await homePage.goto('en');
    await accessibilityPage.goto();
    await accessibilityPage.expectVisibleElements();
    // ensure the language selection has the Cymraeg toggle
    await accessibilityPage.expectLanguageLinkToContainText('Cymraeg');

    await homePage.goto('cy');
    await accessibilityPage.goto();
    await accessibilityPage.expectVisibleElements();
    // ensure the language selection has the English toggle
    await accessibilityPage.expectLanguageLinkToContainText('English');
  });
});

test.describe('Accessibility Page Content Checks', () => {
  test('should have content and show the correct page heading (english)', async ({ page }) => {
    const accessibilityPage = new AccessibilityPage(page);
    await accessibilityPage.goto('en');
    await accessibilityPage.expectMainContentToBePopulated();
    await accessibilityPage.expectHeadingToContainText(
      'Accessibility statement for the ‘Find a Court or Tribunal’ service'
    );
  });

  test('should have content and show the correct page heading (welsh)', async ({ page }) => {
    const accessibilityPage = new AccessibilityPage(page);
    await accessibilityPage.goto('cy');
    await accessibilityPage.expectMainContentToBePopulated();
    await accessibilityPage.expectHeadingToContainText(
      'Datganiad hygyrchedd ar gyfer y gwasanaeth ‘Dod o hyd i lys neu dribiwnlys’'
    );
  });
});
