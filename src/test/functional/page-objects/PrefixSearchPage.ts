import { Locator, expect } from '@playwright/test';

import { Base } from './base';

export class PrefixSearchPage extends Base {
  private readonly header = this.page.locator('header');
  private readonly title = this.page.locator('section.govuk-service-navigation');
  private readonly phaseBanner = this.page.locator('div.govuk-phase-banner');
  private readonly languageLink = this.page.locator('a.govuk-link.fact-language');
  private readonly mainContent = this.page.locator('#main-content');
  private readonly footer = this.page.locator('footer');
  private readonly heading = this.page.locator('h1.govuk-fieldset__heading');
  private readonly summary = this.page.locator('#prefix-hint');
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
    await expect(this.header).toBeVisible();
    await expect(this.title).toBeVisible();
    await expect(this.phaseBanner).toBeVisible();
    await expect(this.languageLink).toBeVisible();
    await expect(this.heading).toBeVisible();
    await expect(this.mainContent).toBeVisible();
    await expect(this.footer).toBeVisible();
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
