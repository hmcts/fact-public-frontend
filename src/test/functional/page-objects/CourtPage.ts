import { expect } from '@playwright/test';

import { Base } from './base';

export class CourtPage extends Base {
  private readonly header = this.page.locator('header');
  private readonly title = this.page.locator('section.govuk-service-navigation');
  private readonly phaseBanner = this.page.locator('div.govuk-phase-banner');
  private readonly languageLink = this.page.locator('a.govuk-link.fact-language');
  private readonly mainContent = this.page.locator('#main-content');
  private readonly footer = this.page.locator('footer');
  private readonly heading = this.page.locator('h1.govuk-heading-l');
  private readonly addressesSection = this.page.locator('h2.govuk-heading-m', { hasText: 'Address' });
  private readonly openingHoursSection = this.page.locator('h2.govuk-heading-m', { hasText: 'Opening hours' });
  private readonly accordion = this.page.locator('.govuk-accordion');

  async goto(slug: string, lng?: string): Promise<void> {
    if (lng) {
      await this.page.goto(`/courts/${slug}?lng=${lng}`);
    } else {
      await this.page.goto(`/courts/${slug}`);
    }
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

  async expectLanguageLinkToContainText(language: string): Promise<void> {
    await expect(this.languageLink).toContainText(language);
  }

  async expectHeadingToContainText(text: string): Promise<void> {
    await expect(this.heading).toContainText(text);
  }

  async expectAddressesToBeVisible(): Promise<void> {
    await expect(this.addressesSection).toBeVisible();
  }

  async expectOpeningHoursToBeVisible(): Promise<void> {
    await expect(this.openingHoursSection).toBeVisible();
  }

  async expectAccordionSectionVisible(headingText: string): Promise<void> {
    const section = this.accordion.locator('.govuk-accordion__section-heading-text-focus', { hasText: headingText });
    await expect(section).toBeVisible();
  }

  async expandAccordionSection(headingText: string): Promise<void> {
    const button = this.accordion.locator('button.govuk-accordion__section-button', { hasText: headingText });
    await button.click();
    const section = this.accordion.locator('.govuk-accordion__section', { hasText: headingText });
    await expect(section).toHaveClass(/govuk-accordion__section--expanded/);
  }

  async expectSectionContent(headingText: string, contentText: string): Promise<void> {
    const sectionContent = this.accordion
      .locator('.govuk-accordion__section--expanded', { hasText: headingText })
      .locator('.govuk-accordion__section-content')
      .locator('p.govuk-body');
    await expect(sectionContent).toContainText(contentText);
  }
}
