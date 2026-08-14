import { expect } from '@playwright/test';

import { Base } from '../base';

export class UnknownServicePage extends Base {
  async goto(lng?: string): Promise<void> {
    if (lng) {
      await this.page.goto(`/service-not-found?lng=${lng}`);
    } else {
      await this.page.goto('/service-not-found');
    }
  }

  async expectHeadingToContainText(text: string): Promise<void> {
    await expect(this.heading).toContainText(text);
  }

  async expectVisibleElements(): Promise<void> {
    await super.expectVisibleElements();
  }

  async expectMainContentToContainText(text: string): Promise<void> {
    await expect(this.mainContent).toContainText(text);
  }
}
