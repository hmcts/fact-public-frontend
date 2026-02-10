import { DateTime } from 'luxon';

import { Court, courtAddressTypeSchema } from '../schemas/courtSchema';
import { hasText } from '../utils/stringUtils';

export class CourtService {
  /**
   * Formats and normalizes Court data for display.
   */
  public formatData(court: Court, language: string): Court {
    return {
      ...court,
      lastUpdatedAt: this.formatLastUpdateDate(court.lastUpdatedAt, language),
      courtAddresses: this.orderAddresses(court.courtAddresses).map(address => ({
        ...address,
        formattedAddressLines: this.buildAddressLines(address),
        formattedAddressTags: this.buildAddressTags(address),
        directionsUrl: this.buildDirectionsUrl(address),
      })),
    };
  }

  /**
   * Formats the last updated timestamp into a human-readable date string.
   */
  private formatLastUpdateDate(timestamp: string, language: string): string {
    return DateTime.fromISO(timestamp, { zone: 'Europe/London' }).setLocale(language).toFormat('d LLLL yyyy');
  }

  /**
   * Orders addresses by preferred address type priority.
   */
  private orderAddresses(addresses: Court['courtAddresses']): Court['courtAddresses'] {
    const rank = {
      [courtAddressTypeSchema.enum.VISIT_US]: 0,
      [courtAddressTypeSchema.enum.VISIT_OR_CONTACT_US]: 1,
      [courtAddressTypeSchema.enum.WRITE_TO_US]: 2,
    } as const;

    return [...addresses].sort((first, second) => (rank[first.addressType] ?? 10) - (rank[second.addressType] ?? 10));
  }

  /**
   * Builds the address lines for display, skipping empty values.
   */
  private buildAddressLines(address: Court['courtAddresses'][number]): string[] {
    return [address.addressLine1, address.addressLine2, address.townCity, address.county, address.postcode].filter(
      hasText
    );
  }

  /**
   * Builds a comma-separated list of areas of law and court type names.
   */
  private buildAddressTags(address: Court['courtAddresses'][number]): string[] {
    const areaNames = address.areasOfLaw.map(area => area.name);
    const courtTypeNames = address.courtTypes.map(courtType => courtType.name);
    return [...areaNames, ...courtTypeNames].filter(hasText);
  }

  /**
   * Builds the Google Maps directions link for visit addresses when coordinates are present.
   */
  private buildDirectionsUrl(address: Court['courtAddresses'][number]): string | null {
    if (address.addressType !== courtAddressTypeSchema.enum.VISIT_US) {
      return null;
    }

    if (address.lat === null || address.lon === null) {
      return null;
    }

    return `https://www.google.com/maps?q=${address.lat},${address.lon}`;
  }
}
