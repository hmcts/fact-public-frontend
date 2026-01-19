import { Locator, Page } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

/**
 * Page Object for the Home Page
 * Represents the main landing page of the application
 */
export class HomePage extends Base {
  // Locators
  readonly heading: Locator;
  readonly mainContent: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('h1.govuk-heading-xl');
    this.mainContent = page.locator('main#main-content');
  }

  /**
   * Navigate to the home page
   */
  async goto(): Promise<void> {
    await this.page.goto(config.urls.baseUrl + '/');
    await this.waitForPageLoad();
  }

  /**
   * Get the main heading text
   */
  async getHeadingText(): Promise<string> {
    return (await this.heading.textContent()) || '';
  }

  /**
   * Check if the page is loaded
   */
  async isLoaded(): Promise<boolean> {
    return this.heading.isVisible();
  }
}
