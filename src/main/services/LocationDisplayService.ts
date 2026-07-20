import { DateTime } from 'luxon';

import { hasText } from '../utils/stringUtils';

export type LocationAddress = {
  addressLine1?: string | null;
  addressLine2?: string | null;
  townCity?: string | null;
  county?: string | null;
  postcode?: string | null;
  lat?: number | null;
  lon?: number | null;
  addressType?: string | null;
};

/**
 * Formats shared location data for the court and service-centre citizen pages.
 */
export class LocationDisplayService {
  public formatLastUpdateDate(timestamp: string | null | undefined, language: string): string {
    if (!hasText(timestamp)) {
      return '';
    }

    const date = DateTime.fromISO(timestamp, { zone: 'Europe/London' });
    return date.isValid ? date.setLocale(language).toFormat('d LLLL yyyy') : '';
  }

  public buildAddressLines(address: LocationAddress): string[] {
    return [address.addressLine1, address.addressLine2, address.townCity, address.county, address.postcode].filter(
      hasText
    );
  }

  public buildDirectionsUrl(address: LocationAddress): string | null {
    if (
      address.addressType !== 'VISIT_US' ||
      address.lat === null ||
      address.lat === undefined ||
      address.lon === null ||
      address.lon === undefined
    ) {
      return null;
    }

    return `https://www.google.com/maps?q=${address.lat},${address.lon}`;
  }
}
