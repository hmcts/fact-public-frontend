import { expect } from '@playwright/test';

import { Base } from '../base';

export class PostcodeSearchPage extends Base {
  private readonly postcodeInput = this.page.locator('input[name="postcode"]');
  private readonly continueButton = this.page.locator('button[type="submit"]');
  private readonly errorSummary = this.page.locator('.govuk-error-summary');

  async goto(params?: { service?: string; serviceArea?: string; action?: string; lng?: string }): Promise<void> {
    let url = '/search-by-postcode';
    if (params?.service && params?.serviceArea && params?.action) {
      url = `/services/${params.service}/${params.serviceArea}/${params.action}/search-by-postcode`;
    }
    if (params?.lng) {
      url += (url.includes('?') ? '&' : '?') + `lng=${params.lng}`;
    }
    await this.page.goto(url);
  }

  async expectVisibleElements(): Promise<void> {
    await super.expectVisibleElements();
    await expect(this.postcodeInput).toBeVisible();
    await expect(this.continueButton).toBeVisible();
  }

  async expectHeadingToContainText(text: string): Promise<void> {
    await expect(this.heading).toContainText(text);
  }

  async enterPostcode(postcode: string): Promise<void> {
    await this.postcodeInput.fill(postcode);
  }

  async submit(): Promise<void> {
    await this.continueButton.click();
  }

  async expectErrorSummaryToContainText(text: string): Promise<void> {
    await expect(this.errorSummary).toContainText(text);
  }
}
