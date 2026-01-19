import { Page } from '@playwright/test';

import { HomePage } from './home.page';

/**
 * Page Object Fixtures
 * Provides auto-instantiated page objects to test
 */
export interface PageFixtures {
  homePage: HomePage;
}

export const pageFixtures = {
  /**
   * Home page fixture
   * Automatically navigates to the home page
   */
  homePage: async ({ page }: { page: Page }, use: (page: HomePage) => Promise<void>): Promise<void> => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await use(homePage);
  },
};
