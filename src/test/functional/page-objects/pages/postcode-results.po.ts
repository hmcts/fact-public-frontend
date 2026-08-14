import { expect } from '@playwright/test';

import { Base } from '../base';

export class PostcodeResultsPage extends Base {
  async goto(params: {
    postcode: string;
    service?: string;
    serviceArea?: string;
    action?: string;
    lng?: string;
  }): Promise<void> {
    let url = '/search-by-postcode/courts/near?postcode=' + encodeURIComponent(params.postcode);
    if (params.service && params.serviceArea && params.action) {
      url = `/services/${params.service}/${params.serviceArea}/${params.action}/search-by-postcode/courts/near?postcode=${encodeURIComponent(params.postcode)}`;
    }
    if (params.lng) {
      url += `&lng=${params.lng}`;
    }
    await this.page.goto(url);
  }

  async expectVisibleElements(): Promise<void> {
    await super.expectVisibleElements();
  }

  async expectHeadingToContainText(text: string): Promise<void> {
    await expect(this.heading).toContainText(text);
  }
}
