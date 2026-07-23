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
  private readonly courtPhoto = this.page.locator('img.govuk-\\!-margin-top-4');
  private readonly accordion = this.page.locator('.govuk-accordion');

  private staticSection(headingText: string) {
    return this.page.locator('section', { has: this.page.locator('h2', { hasText: headingText }) });
  }

  private expandedAccordionSection(headingText: string) {
    return this.accordion.locator('.govuk-accordion__section--expanded', { hasText: headingText });
  }

  private accordionSection(headingText: string) {
    return this.accordion
      .locator('button.govuk-accordion__section-button', { hasText: headingText })
      .locator(
        'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " govuk-accordion__section ")][1]'
      );
  }

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

  async expectCourtPhotoToBeVisible(fileLink: string, altText: string): Promise<void> {
    await expect(this.courtPhoto).toBeVisible();
    await expect(this.courtPhoto).toHaveAttribute('src', new RegExp(String.raw`${fileLink}\?.+`));
    await expect(this.courtPhoto).toHaveAttribute('alt', altText);
  }

  async expectMainContentToContainText(text: string): Promise<void> {
    await expect(this.mainContent).toContainText(text);
  }

  async expectStaticSectionContent(headingText: string, contentText: string): Promise<void> {
    const sectionContent = this.staticSection(headingText);

    await expect(sectionContent).toContainText(contentText);
  }

  async expectStaticSectionLinkToHaveAttributes(
    headingText: string,
    linkText: string,
    attributes: Record<string, string>
  ): Promise<void> {
    const href = attributes.href;
    const link = href
      ? this.staticSection(headingText).locator(`a[href="${href}"]`)
      : this.staticSection(headingText).getByRole('link', { name: linkText });
    if (href) {
      await expect(link).toHaveCount(1);
    } else {
      await expect(link).toBeVisible();
    }

    for (const [name, value] of Object.entries(attributes)) {
      await expect(link).toHaveAttribute(name, value);
    }
  }

  async expectAccordionSectionVisible(headingText: string): Promise<void> {
    const section = this.accordion.locator('.govuk-accordion__section-heading-text-focus', { hasText: headingText });
    await expect(section).toBeVisible();
  }

  async expandAccordionSection(headingText: string): Promise<void> {
    const button = this.accordion.locator('button.govuk-accordion__section-button', { hasText: headingText });
    await button.click();
    await this.expectAccordionSectionExpanded(headingText);
  }

  async expectAccordionSectionExpanded(headingText: string): Promise<void> {
    const section = this.accordionSection(headingText);
    await expect(section).toHaveClass(/govuk-accordion__section--expanded/);
  }

  async expectAccordionSectionCollapsed(headingText: string): Promise<void> {
    const section = this.accordionSection(headingText);
    await expect(section).not.toHaveClass(/govuk-accordion__section--expanded/);
  }

  async clickShowAllSections(): Promise<void> {
    const showAllButton = this.accordion.locator('.govuk-accordion__show-all');
    await showAllButton.click();
  }

  async clickHideAllSections(): Promise<void> {
    const hideAllButton = this.accordion.locator('.govuk-accordion__show-all');
    await hideAllButton.click();
  }

  async expectAccordionSectionContent(headingText: string, contentText: string): Promise<void> {
    const sectionContent = this.expandedAccordionSection(headingText).locator('.govuk-accordion__section-content');
    await expect(sectionContent).toContainText(contentText);
  }

  async expectAccordionSectionLinkToHaveAttributes(
    headingText: string,
    linkName: string,
    attributes: Record<string, string>
  ): Promise<void> {
    const href = attributes.href;
    const link = href
      ? this.expandedAccordionSection(headingText).locator(`a[href="${href}"]`)
      : this.expandedAccordionSection(headingText).getByRole('link', { name: linkName });
    if (href) {
      await expect(link).toHaveCount(1);
    } else {
      await expect(link).toBeVisible();
    }

    for (const [name, value] of Object.entries(attributes)) {
      await expect(link).toHaveAttribute(name, value);
    }
  }
}
