import { expect } from '@playwright/test';

import { Base } from './base';

export class NotFoundPage extends Base {
  private readonly header = this.page.locator('header');
  private readonly title = this.page.locator('section.govuk-service-navigation');
  private readonly phaseBanner = this.page.locator('div.govuk-phase-banner');
  private readonly languageLink = this.page.locator('a.govuk-link.fact-language');
  private readonly mainContent = this.page.locator('#main-content');
  private readonly footer = this.page.locator('footer');
  private readonly heading = this.page.locator('h1.govuk-heading-xl');

  async goto(lng?: string): Promise<void> {
    if (lng) {
      await this.page.goto(`/?lng=${lng}`);
    } else {
      await this.page.goto('/');
    }
  }

  async expectVisibleElements(): Promise<void> {
    await expect(this.header).toBeVisible();
    await expect(this.title).toBeVisible();
    await expect(this.phaseBanner).toBeVisible();
    await expect(this.languageLink).toBeVisible();
    await expect(this.heading).toBeVisible();
    await expect(this.mainContent).toBeVisible();
    await expect(this.footer).toBeVisible();
  }

  async expectLanguageLinkToContainText(language: string): Promise<void> {
    await expect(this.languageLink).toContainText(language);
  }

  async expectHeadingToContainText(text: string): Promise<void> {
    await expect(this.heading).toContainText(text);
  }

  async expectMainContentToBePopulated(): Promise<void> {
    await expect(this.mainContent).toContainText(/\w+/);
  }
}
