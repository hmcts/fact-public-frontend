import { expect } from '@playwright/test';

import { Base } from '../base';

export class ServiceResultsPage extends Base {
  private readonly courtLink = this.page.locator('a.govuk-link[href^="/courts/"]');
  private readonly onlineSection = this.page.locator('#areas-of-law');

  async goto(params: { service: string; serviceArea: string; lng?: string }): Promise<void> {
    let url = `/services/${params.service}/${params.serviceArea}/search-results`;
    if (params.lng) {
      url += `?lng=${params.lng}`;
    }
    await this.page.goto(url);
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
