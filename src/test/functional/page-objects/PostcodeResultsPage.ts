import { expect } from '@playwright/test';

import { Base } from './base';

export class PostcodeResultsPage extends Base {
  private readonly header = this.page.locator('header');
  private readonly title = this.page.locator('section.govuk-service-navigation');
  private readonly phaseBanner = this.page.locator('div.govuk-phase-banner');
  private readonly languageLink = this.page.locator('a.govuk-link.fact-language');
  private readonly mainContent = this.page.locator('#main-content');
  private readonly footer = this.page.locator('footer');
  private readonly heading = this.page.locator('h1.govuk-heading-l');

  async goto(params: {
    postcode: string;
    service?: string;
    serviceArea?: string;
    action?: string;
    lng?: string;
  }): Promise<void> {
    let url = '/search-by-postcode/courts/near?postcode=' + encodeURIComponent(params.postcode);
    if (params.service && params.serviceArea && params.action) {
      url = `/services/${params.service}/${params.serviceArea}/${params.action}/search-by-postcode/courts/near?postcode=${encodeURIComponent(params.postcode)}`;
    }
    if (params.lng) {
      url += `&lng=${params.lng}`;
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
}
