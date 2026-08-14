import { Locator, expect } from '@playwright/test';

import { Base } from '../base';

export class PrefixSearchPage extends Base {
  private readonly alphabetButtons = this.page.locator('#alphabet-buttons .govuk-button');
  private readonly resultsHint = this.page.locator('#header-hint');
  private readonly resultsList = this.page.locator('#results-list');
  private readonly courtLinks = this.page.locator('#results-list a.govuk-link');
  private readonly errorSummary = this.page.locator('.govuk-error-summary');

  async goto(lng?: string, prefix?: string): Promise<void> {
    let url = '/services/search-by-prefix';
    const params = new URLSearchParams();
    if (lng) {
      params.set('lng', lng);
    }
    if (prefix) {
      params.set('prefix', prefix);
    }

    const queryString = params.toString();
    if (queryString) {
      url += '?' + queryString;
    }
    await this.page.goto(url);
  }

  async expectVisibleElements(): Promise<void> {
    await super.expectVisibleElements();
    await expect(this.alphabetButtons.first()).toBeVisible();
    await expect(this.alphabetButtons).toHaveCount(26);
  }

  async expectHeadingToContainText(text: string): Promise<void> {
    await expect(this.heading).toContainText(text);
  }

  async clickAlphabetButton(letter: string): Promise<void> {
    await this.page.locator(`#alphabet-buttons a.govuk-button:has-text("${letter}")`).click();
  }

  async expectResultsHintToContainText(text: string): Promise<void> {
    await expect(this.resultsHint).toContainText(text);
  }

  async expectResultsListToBeVisible(): Promise<void> {
    await expect(this.resultsList).toBeVisible();
  }

  async expectResultsCount(count: number): Promise<void> {
    await expect(this.courtLinks).toHaveCount(count);
  }

  async expectErrorSummaryToContainText(text: string): Promise<void> {
    await expect(this.errorSummary).toContainText(text);
  }

  async expectVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  }

  async getCourtLink(name: string): Promise<Locator> {
    return this.page.locator(`#results-list a.govuk-link:has-text("${name}")`);
  }
}
