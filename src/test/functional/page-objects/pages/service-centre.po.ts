import { Response, expect } from '@playwright/test';

import { Base } from '../base';

export class ServiceCentrePage extends Base {
  private readonly accordion = this.page.locator('#service-centre-details-accordion');
  private readonly addressesSection = this.page.locator('#addresses');
  private readonly casesHeardSection = this.page.locator('#cases-heard');
  private readonly contactDetailsSection = this.page.locator('#contact-details');
  private readonly usefulInformationSection = this.page.locator('#useful-information');
  private readonly warningNotice = this.page.locator('.govuk-warning-text');

  async goto(slug: string, lng?: string): Promise<Response | null> {
    const languageQuery = lng ? `?lng=${lng}` : '';
    return this.page.goto(`/service-centres/${slug}${languageQuery}`);
  }

  async switchLanguageTo(lng: string): Promise<void> {
    await this.languageLink.click();
    await this.page.waitForURL(new RegExp(`lng=${lng}`));
  }

  async expectLanguageLinkToContainText(language: string): Promise<void> {
    await expect(this.languageLink).toContainText(language);
  }

  async expectHeadingToHaveText(text: string): Promise<void> {
    await expect(this.heading).toHaveText(text);
  }

  async expectHeadingToContainText(text: string): Promise<void> {
    await expect(this.heading).toContainText(text);
  }

  async expectMainContentToContainText(text: string): Promise<void> {
    await expect(this.mainContent).toContainText(text);
  }

  async expectMainContentNotToContainText(text: string): Promise<void> {
    await expect(this.mainContent).not.toContainText(text);
  }

  async expectAddressesToContainText(text: string): Promise<void> {
    await expect(this.addressesSection).toContainText(text);
  }

  async expectUsefulInformationToContainText(text: string): Promise<void> {
    await expect(this.usefulInformationSection).toContainText(text);
  }

  async expectAccordionButtonsToContainText(text: string[]): Promise<void> {
    await expect(this.accordion.locator('.govuk-accordion__section-button')).toContainText(text);
  }

  async expectSectionOrder(expectedOrder: string[]): Promise<void> {
    const sectionOrder = await this.page
      .locator('main h1, main #addresses, main #useful-information, main #service-centre-details-accordion')
      .evaluateAll(elements => elements.map(element => element.id || element.tagName.toLowerCase()));
    expect(sectionOrder).toEqual(expectedOrder);
  }

  async expectWarningNoticeCount(count: number): Promise<void> {
    await expect(this.warningNotice).toHaveCount(count);
  }

  async expectWarningNoticeToContainText(text: string): Promise<void> {
    await expect(this.warningNotice).toContainText(text);
  }

  async expectWarningNoticeNotToContainText(text: string): Promise<void> {
    await expect(this.warningNotice).not.toContainText(text);
  }

  async expectAccordionSectionsCollapsed(sectionNames: string[]): Promise<void> {
    const buttons = this.accordion.locator('.govuk-accordion__section-button');
    await expect(buttons).toHaveCount(sectionNames.length);

    for (const sectionName of sectionNames) {
      await expect(this.accordion.getByRole('button', { name: new RegExp(sectionName) })).toHaveAttribute(
        'aria-expanded',
        'false'
      );
    }
  }

  async expandAccordionSection(sectionName: string): Promise<void> {
    await this.accordion.getByRole('button', { name: new RegExp(sectionName) }).click();
  }

  async expectContactTableCount(count: number): Promise<void> {
    await expect(this.contactDetailsSection.locator('table')).toHaveCount(count);
  }

  async expectContactPhoneTextToBeVisible(): Promise<void> {
    await expect(this.contactDetailsSection.locator('.phone-text')).toBeVisible();
  }

  async expectContactPhoneLinkCount(count: number): Promise<void> {
    await expect(this.contactDetailsSection.locator('a[href^="tel:"]')).toHaveCount(count);
  }

  async expectContactEmailLinkToBeVisible(): Promise<void> {
    await expect(this.contactDetailsSection.locator('a[href^="mailto:"]')).toBeVisible();
  }

  async expectCasesHeardToBePopulated(): Promise<void> {
    await expect(this.casesHeardSection.locator('li')).not.toHaveCount(0);
  }

  async expectFirstCaseLinkToOpenInNewTab(): Promise<void> {
    await expect(this.casesHeardSection.locator('a').first()).toHaveAttribute('target', '_blank');
  }

  async expectOutboundLinkToHaveAttributes(href: string, attributes: Record<string, string>): Promise<void> {
    const link = this.usefulInformationSection.locator(`a[href="${href}"]`);

    for (const [name, value] of Object.entries(attributes)) {
      await expect(link).toHaveAttribute(name, value);
    }
  }
}
