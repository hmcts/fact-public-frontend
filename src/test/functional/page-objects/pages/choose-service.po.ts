import { expect } from '@playwright/test';

import { Base } from '../base';

export class ChooseServicePage extends Base {
  private readonly serviceRadio = (service: string) => this.page.locator(`input[type="radio"][value="${service}"]`);
  private readonly continueButton = this.page.locator('button[type="submit"]');
  private readonly errorSummary = this.page.locator('.govuk-error-summary');

  async goto(action: string, lng?: string): Promise<void> {
    let url = `/services/${action}`;
    if (lng) {
      url += `?lng=${lng}`;
    }
    await this.page.goto(url);
  }

  async expectHeadingToContainText(text: string): Promise<void> {
    await expect(this.heading).toContainText(text);
  }

  async selectService(service: string): Promise<void> {
    await this.serviceRadio(service).check();
  }

  async submit(): Promise<void> {
    await this.continueButton.click();
  }

  async expectErrorSummaryVisible(): Promise<void> {
    await expect(this.errorSummary).toBeVisible();
  }

  async expectMainContentToContainText(text: string): Promise<void> {
    await expect(this.mainContent).toContainText(text);
  }
}
