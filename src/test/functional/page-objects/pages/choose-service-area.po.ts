import { expect } from '@playwright/test';

import { Base } from '../base';

export class ChooseServiceAreaPage extends Base {
  private readonly continueButton = this.page.locator('button[type="submit"]');

  async goto(service: string, action: string, lng?: string): Promise<void> {
    let url = `/services/${service}/service-areas/${action}`;
    if (lng) {
      url += `?lng=${lng}`;
    }
    await this.page.goto(url);
  }

  async submit(): Promise<void> {
    await this.continueButton.click();
  }

  async expectMainContentToContainText(text: string): Promise<void> {
    await expect(this.mainContent).toContainText(text);
  }
}
