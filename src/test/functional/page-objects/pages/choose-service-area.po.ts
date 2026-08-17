import { expect } from '@playwright/test';

import { Base } from '../base';

export class ChooseServiceAreaPage extends Base {
  private readonly areaRadio = (area: string) => this.page.locator(`input[type="radio"][value="${area}"]`);
  private readonly continueButton = this.page.locator('button[type="submit"]');
  private readonly errorSummary = this.page.locator('.govuk-error-summary');

  async goto(service: string, action: string, lng?: string): Promise<void> {
    let url = `/services/${service}/service-areas/${action}`;
    if (lng) {
      url += `?lng=${lng}`;
    }
    await this.page.goto(url);
  }

  async expectHeadingToContainText(text: string): Promise<void> {
    await expect(this.heading).toContainText(text);
  }

  async selectArea(area: string): Promise<void> {
    await this.areaRadio(area).check();
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
