import { Page } from '@playwright/test';

/**
 * Base class for all Page Objects
 * Provides common functionality and components
 * All page objects should extend this class
 */
export abstract class Base {
  constructor(public readonly page: Page) {}

  /**
   * Navigate to a specific path
   */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }
}
