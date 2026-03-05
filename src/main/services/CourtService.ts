import { DateTime } from 'luxon';

import { Court, courtAddressTypeSchema } from '../schemas/courtSchema';
import { hasText } from '../utils/stringUtils';

type OpeningHourEntry = {
  dayOfWeek: string;
  openingHour: string;
  closingHour: string;
};

type OpeningHourGroup = {
  typeName: string;
  hours: OpeningHourEntry[];
};

type CounterService = {
  courtTypes: Court['courtAddresses'][number]['courtTypes'];
  assistWithForms: boolean;
  assistWithDocuments: boolean;
  assistWithSupport: boolean;
  appointmentNeeded: boolean;
  appointmentContact: string | null;
  appointmentContactIsPhone: boolean;
  counterOpenHours: OpeningHourEntry[];
};

const DAY_ORDER = ['EVERYDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;

const DAY_RANK: Map<string, number> = new Map(DAY_ORDER.map((day, index) => [day, index]));

export type CourtViewModel = Court & {
  openingHoursByType: OpeningHourGroup[];
  enquiriesPhoneNumber: string | null;
  counterService: CounterService | null;
};

export class CourtService {
  /**
   * Formats and normalizes Court data for display.
   */
  public formatData(court: Court, language: string): CourtViewModel {
    return {
      ...court,
      lastUpdatedAt: this.formatLastUpdateDate(court.lastUpdatedAt, language),
      courtAddresses: this.orderAddresses(court.courtAddresses).map(address => ({
        ...address,
        formattedAddressLines: this.buildAddressLines(address),
        formattedAddressTags: this.buildAddressTags(address),
        directionsUrl: this.buildDirectionsUrl(address),
      })),
      courtOpeningHours: this.orderOpeningHours(court.courtOpeningHours),
      openingHoursByType: this.buildOpeningHoursByType(court.courtOpeningHours),
      enquiriesPhoneNumber: this.findEnquiriesPhoneNumber(court.courtContactDetails),
      counterService: this.buildCounterService(court.courtCounterServiceOpeningHours),
    } as CourtViewModel;
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
    return [...address.areasOfLaw, ...address.courtTypes].map(item => item.name).filter(hasText);
  }

  /**
   * Builds the Google Maps directions link for visit addresses when coordinates are present.
   */
  private buildDirectionsUrl(address: Court['courtAddresses'][number]): string | null {
    if (address.addressType !== courtAddressTypeSchema.enum.VISIT_US || address.lat === null || address.lon === null) {
      return null;
    }

    return `https://www.google.com/maps?q=${address.lat},${address.lon}`;
  }

  /**
   * Returns the enquiries phone number when available.
   */
  private findEnquiriesPhoneNumber(contactDetails: Court['courtContactDetails']): string | null {
    for (const contact of contactDetails) {
      if (contact.courtContactDescription.name.toLowerCase() !== 'enquiries') {
        continue;
      }

      if (hasText(contact.phoneNumber)) {
        return contact.phoneNumber;
      }
    }

    return null;
  }

  /**
   * Orders opening hours alphabetically by opening hour type name.
   */
  private orderOpeningHours(openingHours: Court['courtOpeningHours']): Court['courtOpeningHours'] {
    return [...openingHours].sort((a, b) =>
      a.openingHourType.name.localeCompare(b.openingHourType.name, undefined, { sensitivity: 'base' })
    );
  }

  /**
   * Groups opening hours by type, with hours ordered by day of week.
   */
  private buildOpeningHoursByType(openingHours: Court['courtOpeningHours']): OpeningHourGroup[] {
    const byType = this.groupOpeningHoursByType(openingHours);
    return this.sortOpeningHourGroups(byType);
  }

  /**
   * Builds counter service view model from the first configured counter service entry.
   */
  private buildCounterService(counterHours: Court['courtCounterServiceOpeningHours']): CounterService | null {
    if (!counterHours.length) {
      return null;
    }

    const counterService = counterHours[0];
    const hasHelpItems =
      counterService.assistWithForms || counterService.assistWithDocuments || counterService.assistWithSupport;
    const hasOpeningTimes = counterService.openingTimesDetails.length > 0;

    if (!hasHelpItems && !hasOpeningTimes) {
      return null;
    }

    const appointmentContact = hasText(counterService.appointmentContact) ? counterService.appointmentContact : null;

    return {
      courtTypes: counterService.courtTypes ?? [],
      assistWithForms: counterService.assistWithForms,
      assistWithDocuments: counterService.assistWithDocuments,
      assistWithSupport: counterService.assistWithSupport,
      appointmentNeeded: counterService.appointmentNeeded,
      appointmentContact,
      appointmentContactIsPhone: appointmentContact ? this.isPhoneLikeValue(appointmentContact) : false,
      counterOpenHours: this.sortHoursByDay(
        counterService.openingTimesDetails.map(entry => ({
          dayOfWeek: entry.dayOfWeek,
          openingHour: this.formatTime(entry.openingTime),
          closingHour: this.formatTime(entry.closingTime),
        }))
      ),
    };
  }

  /**
   * Groups opening hour entries by their type name.
   */
  private groupOpeningHoursByType(openingHours: Court['courtOpeningHours']): Map<string, OpeningHourEntry[]> {
    const byType = new Map<string, OpeningHourEntry[]>();

    for (const entry of openingHours) {
      const typeName = entry.openingHourType.name;
      const hours = byType.get(typeName) ?? [];
      for (const openingTimeEntry of entry.openingTimesDetails) {
        hours.push({
          dayOfWeek: openingTimeEntry.dayOfWeek,
          openingHour: this.formatTime(openingTimeEntry.openingTime),
          closingHour: this.formatTime(openingTimeEntry.closingTime),
        });
      }
      byType.set(typeName, hours);
    }

    return byType;
  }

  /**
   * Sorts opening hour groups alphabetically by type name.
   */
  private sortOpeningHourGroups(byType: Map<string, OpeningHourEntry[]>): OpeningHourGroup[] {
    return Array.from(byType.entries())
      .sort(([firstType], [secondType]) => firstType.localeCompare(secondType, undefined, { sensitivity: 'base' }))
      .map(([typeName, hours]) => ({
        typeName,
        hours: this.sortHoursByDay(hours),
      }));
  }

  /**
   * Sorts a list of hours by day of week order.
   */
  private sortHoursByDay(hours: OpeningHourEntry[]): OpeningHourEntry[] {
    return [...hours].sort((first, second) => {
      const firstRank = DAY_RANK.get(first.dayOfWeek) ?? DAY_ORDER.length;
      const secondRank = DAY_RANK.get(second.dayOfWeek) ?? DAY_ORDER.length;
      return firstRank - secondRank;
    });
  }

  /**
   * Formats a time string like HH:mm:ss into a human-friendly lowercase time.
   */
  private formatTime(value: string): string {
    return DateTime.fromFormat(value, 'HH:mm:ss', { zone: 'Europe/London' }).toFormat('h:mma').toLowerCase();
  }

  /**
   * Returns true when a value looks like a phone number and can be used with tel:.
   */
  private isPhoneLikeValue(value: string): boolean {
    return /\d/.test(value) && /^[+\d\s()-]+$/.test(value);
  }
}
