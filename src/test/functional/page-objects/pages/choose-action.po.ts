import { expect } from '@playwright/test';

import { Base } from '../base';

export class ChooseActionPage extends Base {
  private readonly actionRadio = (action: string) => this.page.locator(`input[type="radio"][value="${action}"]`);
  private readonly continueButton = this.page.locator('button[type="submit"]');
  private readonly errorSummary = this.page.locator('.govuk-error-summary');
  private readonly backLink = this.page.locator('a.govuk-back-link');

  async goto(lng?: string): Promise<void> {
    if (lng) {
      await this.page.goto(`/service-choose-action?lng=${lng}`);
    } else {
      await this.page.goto('/service-choose-action');
    }
  }

  async expectHeadingToContainText(text: string): Promise<void> {
    await expect(this.heading).toContainText(text);
  }

  async expectVisibleElements(): Promise<void> {
    await super.expectVisibleElements();
  }

  async selectAction(action: string): Promise<void> {
    await this.actionRadio(action).check();
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

  async clickBackLink(): Promise<void> {
    await this.backLink.click();
  }

  async expectBackLinkVisible(): Promise<void> {
    await expect(this.backLink).toBeVisible();
  }
}
