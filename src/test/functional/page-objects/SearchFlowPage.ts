import { expect } from '@playwright/test';

import { Base } from './base';

export class SearchFlowPage extends Base {
  private readonly startNowLink = this.page.locator('a.govuk-button[href="/search-option"]');
  private readonly continueButton = this.page.getByRole('button', { name: /Continue|Parhau/ });
  private readonly searchInput = this.page.locator('#search');
  private readonly searchResults = this.page.locator('#search-results');
  private readonly noSearchResults = this.page.locator('#no-search-results');
  private readonly errorSummary = this.page.locator('.govuk-error-summary');
  private readonly pageHeading = this.page.locator('h1');

  async gotoStart(lng: 'en' | 'cy'): Promise<void> {
    await this.page.goto(`/?lng=${lng}`);
  }

  async clickStartNow(): Promise<void> {
    await this.startNowLink.click();
  }

  async selectKnowsLocation(answer: 'yes' | 'no'): Promise<void> {
    await this.page.locator(`input[name="knowsLocation"][value="${answer}"]`).check();
  }

  async clickContinue(): Promise<void> {
    await this.continueButton.click();
  }

  async enterSearchQuery(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  async expectTitle(title: string): Promise<void> {
    await expect(this.page).toHaveTitle(title);
  }

  async expectHeading(heading: string): Promise<void> {
    await expect(this.pageHeading).toContainText(heading);
  }

  async expectPath(pathname: string): Promise<void> {
    await expect.poll(() => new URL(this.page.url()).pathname).toBe(pathname);
  }

  async expectSearchParam(name: string, value: string): Promise<void> {
    await expect.poll(() => new URL(this.page.url()).searchParams.get(name)).toBe(value);
  }

  async expectSearchResultsVisible(): Promise<void> {
    await expect(this.searchResults).toBeVisible();
    await expect(this.searchResults.locator('a.govuk-link').first()).toBeVisible();
  }

  async expectSearchResultLinkText(text: string): Promise<void> {
    await expect(this.searchResults.getByRole('link', { name: text }).first()).toBeVisible();
  }

  async expectSearchResultLinkHref(text: string, href: string): Promise<void> {
    await expect(this.searchResults.getByRole('link', { name: text }).first()).toHaveAttribute('href', href);
  }

  async clickSearchResultLink(text: string): Promise<void> {
    await this.searchResults.getByRole('link', { name: text }).first().click();
  }

  async expectNoResultsVisible(): Promise<void> {
    await expect(this.noSearchResults).toBeVisible();
  }

  async expectErrorSummaryVisible(errorText: string): Promise<void> {
    await expect(this.errorSummary).toBeVisible();
    await expect(this.errorSummary).toContainText(errorText);
  }
}
