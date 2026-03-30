import { expect } from '@playwright/test';

import { Base } from './base';

export class ServiceResultsPage extends Base {
  private readonly header = this.page.locator('header');
  private readonly title = this.page.locator('section.govuk-service-navigation');
  private readonly phaseBanner = this.page.locator('div.govuk-phase-banner');
  private readonly languageLink = this.page.locator('a.govuk-link.fact-language');
  private readonly mainContent = this.page.locator('#main-content');
  private readonly footer = this.page.locator('footer');
  private readonly heading = this.page.locator('h1.govuk-heading-l');
  private readonly courtLink = this.page.locator('a.govuk-link[href^="/courts/"]');
  private readonly onlineSection = this.page.locator('#areas-of-law');

  async goto(params: { service: string; serviceArea: string; lng?: string }): Promise<void> {
    let url = `/services/${params.service}/${params.serviceArea}/search-results`;
    if (params.lng) {
      url += `?lng=${params.lng}`;
    }
    await this.page.goto(url);
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

  async expectHeadingToContainText(text: string): Promise<void> {
    await expect(this.heading).toContainText(text);
  }

  async expectRegionStatementToBeVisible(text: string): Promise<void> {
    await expect(this.page.locator('p.govuk-body-m', { hasText: text })).toBeVisible();
  }

  async expectCourtLinkToBeVisible(): Promise<void> {
    await expect(this.courtLink).toBeVisible();
  }

  async expectOnlineSectionToBeVisible(): Promise<void> {
    await expect(this.onlineSection).toBeVisible();
  }
}
