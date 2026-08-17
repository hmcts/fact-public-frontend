import { test } from '../../fixtures';

test.describe('Home Page Visual & Language Checks', () => {
  test('should load and display correct content sections (english)', { tag: '@smoke' }, async ({ homePage }) => {
    await homePage.goto('en');
    await homePage.expectVisibleElements();
    // ensure the language selection has the Welsh/Cymraeg toggle
    await homePage.expectLanguageLinkToContainText('Cymraeg');
  });

  test('should load and display correct content sections (welsh)', async ({ homePage }) => {
    await homePage.goto('cy');
    await homePage.expectVisibleElements();
    // ensure the language selection has the English toggle
    await homePage.expectLanguageLinkToContainText('English');
  });
});

test.describe('Home Page Content Checks', () => {
  test('should have content and show the correct page heading (english)', async ({ homePage }) => {
    await homePage.goto('en');
    await homePage.expectMainContentToBePopulated();
    await homePage.expectHeadingToContainText('Find a Court or Tribunal');
  });

  test('should have content and show the correct page heading (welsh)', async ({ homePage }) => {
    await homePage.goto('cy');
    await homePage.expectMainContentToBePopulated();
    await homePage.expectHeadingToContainText('Dod o hyd i lys neu dribiwnlys');
  });
});
