import { Court } from '../../../main/schemas/courtSchema';
import { CourtService } from '../../../main/services/CourtService';

const baseCourt: Court = {
  id: '1',
  name: 'Test Court',
  slug: 'test-court',
  open: true,
  warningNotice: null,
  lastUpdatedAt: '2024-01-15T10:00:00.000Z',
  openOnCath: null,
  mrdId: null,
  region: { name: 'Region', country: 'Country' },
  courtDxCodes: [],
  courtCodes: [],
  courtFaxNumbers: [],
  courtAddresses: [],
  courtOpeningHours: [],
  courtCounterServiceOpeningHours: [],
  courtContactDetails: [],
  courtTranslations: [],
  courtAccessibilityOptions: [],
  courtFacilities: [],
  courtProfessionalInformation: [],
  courtAreasOfLaw: [],
  courtPhotos: [],
};

describe('CourtService', () => {
  test('formats last updated date', () => {
    const service = new CourtService();
    const formatted = (
      service as unknown as { formatLastUpdateDate: (t: string, l: string) => string }
    ).formatLastUpdateDate('2024-01-15T10:00:00.000Z', 'en');
    expect(formatted).toBe('15 January 2024');
  });

  test('orders addresses by preferred type and falls back for unknown', () => {
    const service = new CourtService();
    const orderAddresses = (
      service as unknown as { orderAddresses: (a: Court['courtAddresses']) => Court['courtAddresses'] }
    ).orderAddresses;
    const addresses = [
      { addressType: 'WRITE_TO_US' },
      { addressType: 'VISIT_US' },
      { addressType: 'VISIT_OR_CONTACT_US' },
      { addressType: 'OTHER' },
    ] as unknown as Court['courtAddresses'];

    const ordered = orderAddresses(addresses);
    expect(ordered.map(addr => addr.addressType)).toEqual(['VISIT_US', 'VISIT_OR_CONTACT_US', 'WRITE_TO_US', 'OTHER']);
  });

  test('orders addresses when all types are unknown', () => {
    const service = new CourtService();
    const orderAddresses = (
      service as unknown as { orderAddresses: (a: Court['courtAddresses']) => Court['courtAddresses'] }
    ).orderAddresses;
    const addresses = [
      { addressType: 'UNKNOWN_ONE' },
      { addressType: 'UNKNOWN_TWO' },
    ] as unknown as Court['courtAddresses'];
    const ordered = orderAddresses(addresses);
    expect(ordered).toHaveLength(2);
  });

  test('builds address lines and tags', () => {
    const service = new CourtService();
    const buildLines = (
      service as unknown as {
        buildAddressLines: (a: Court['courtAddresses'][number]) => string[];
      }
    ).buildAddressLines;
    const buildTags = (
      service as unknown as {
        buildAddressTags: (a: Court['courtAddresses'][number]) => string[];
      }
    ).buildAddressTags;

    const address = {
      addressLine1: 'Line 1',
      addressLine2: null,
      townCity: 'Town',
      county: '',
      postcode: 'AB1 2CD',
      areasOfLaw: [{ name: 'Civil' }, { name: '' }],
      courtTypes: [{ name: 'Crown' }, { name: ' ' }],
    } as Court['courtAddresses'][number];

    expect(buildLines(address)).toEqual(['Line 1', 'Town', 'AB1 2CD']);
    expect(buildTags(address)).toEqual(['Civil', 'Crown']);
  });

  test('builds directions URL only for visit addresses with coordinates', () => {
    const service = new CourtService();
    const buildDirectionsUrl = (
      service as unknown as {
        buildDirectionsUrl: (a: Court['courtAddresses'][number]) => string | null;
      }
    ).buildDirectionsUrl;

    const visitAddress = {
      addressType: 'VISIT_US',
      lat: 51.4997,
      lon: -0.1347,
    } as Court['courtAddresses'][number];
    const nonVisitAddress = {
      addressType: 'WRITE_TO_US',
      lat: 51.5,
      lon: -0.1,
    } as Court['courtAddresses'][number];
    const missingCoords = {
      addressType: 'VISIT_US',
      lat: null,
      lon: null,
    } as Court['courtAddresses'][number];

    expect(buildDirectionsUrl(visitAddress)).toBe('https://www.google.com/maps?q=51.4997,-0.1347');
    expect(buildDirectionsUrl(nonVisitAddress)).toBeNull();
    expect(buildDirectionsUrl(missingCoords)).toBeNull();
  });

  test('extracts the first enquiries phone number', () => {
    const service = new CourtService();
    const court: Court = {
      ...baseCourt,
      courtContactDetails: [
        {
          courtContactDescriptionId: '1',
          explanation: '',
          explanationCy: '',
          email: '',
          phoneNumber: '111',
          courtContactDescription: { name: 'Enquiries', nameCy: 'Ymholiadau' },
        },
        {
          courtContactDescriptionId: '2',
          explanation: '',
          explanationCy: '',
          email: '',
          phoneNumber: '222',
          courtContactDescription: { name: 'Enquiries', nameCy: 'Ymholiadau' },
        },
      ],
    };

    const viewModel = service.formatData(court, 'en');
    expect(viewModel.enquiriesPhoneNumber).toBe('111');
  });

  test('returns null when no enquiries phone number exists', () => {
    const service = new CourtService();
    const court: Court = {
      ...baseCourt,
      courtContactDetails: [
        {
          courtContactDescriptionId: '1',
          explanation: '',
          explanationCy: '',
          email: '',
          phoneNumber: '',
          courtContactDescription: { name: 'Enquiries', nameCy: 'Ymholiadau' },
        },
        {
          courtContactDescriptionId: '2',
          explanation: '',
          explanationCy: '',
          email: '',
          phoneNumber: '999',
          courtContactDescription: { name: 'Other', nameCy: 'Arall' },
        },
      ],
    };

    const viewModel = service.formatData(court, 'en');
    expect(viewModel.enquiriesPhoneNumber).toBeNull();
  });

  test('orders opening hours and groups by type with day sorting', () => {
    const service = new CourtService();
    const orderOpeningHours = (
      service as unknown as {
        orderOpeningHours: (o: Court['courtOpeningHours']) => Court['courtOpeningHours'];
      }
    ).orderOpeningHours;

    const openingHours = [
      {
        openingTimesDetails: [
          {
            dayOfWeek: 'TUESDAY',
            openingTime: '09:00:00',
            closingTime: '17:00:00',
          },
        ],
        openingHourType: { name: 'B Type', nameCy: 'B' },
      },
      {
        openingTimesDetails: [
          {
            dayOfWeek: 'MONDAY',
            openingTime: '10:00:00',
            closingTime: '16:00:00',
          },
        ],
        openingHourType: { name: 'A Type', nameCy: 'A' },
      },
      {
        openingTimesDetails: [
          {
            dayOfWeek: 'UNKNOWN',
            openingTime: '11:00:00',
            closingTime: '15:00:00',
          },
        ],
        openingHourType: { name: 'A Type', nameCy: 'A' },
      },
    ] as Court['courtOpeningHours'];

    const ordered = orderOpeningHours(openingHours);
    expect(ordered[0].openingHourType.name).toBe('A Type');

    const grouped = (
      service as unknown as {
        buildOpeningHoursByType: (o: Court['courtOpeningHours']) => { typeName: string; hours: unknown[] }[];
      }
    ).buildOpeningHoursByType(openingHours);
    expect(grouped[0].typeName).toBe('A Type');
    expect(grouped[0].hours).toHaveLength(2);
    expect(grouped[0].hours[0]).toMatchObject({ dayOfWeek: 'MONDAY', openingHour: '10:00am', closingHour: '4:00pm' });
  });

  test('sortHoursByDay falls back for unknown days', () => {
    const service = new CourtService();
    const sortHoursByDay = (
      service as unknown as {
        sortHoursByDay: (h: { dayOfWeek: string; openingHour: string; closingHour: string }[]) => unknown[];
      }
    ).sortHoursByDay;
    const hours = [
      { dayOfWeek: 'UNKNOWN_ONE', openingHour: '09:00am', closingHour: '5:00pm' },
      { dayOfWeek: 'UNKNOWN_TWO', openingHour: '10:00am', closingHour: '4:00pm' },
    ];
    const ordered = sortHoursByDay(hours);
    expect(ordered).toHaveLength(2);
  });

  test('formats time to lower-case am/pm', () => {
    const service = new CourtService();
    const formatTime = (service as unknown as { formatTime: (v: string) => string }).formatTime;
    expect(formatTime('13:30:00')).toBe('1:30pm');
  });

  test('builds counter service when all help flags are false but opening times are present', () => {
    const service = new CourtService();
    const court: Court = {
      ...baseCourt,
      courtCounterServiceOpeningHours: [
        {
          counterService: true,
          assistWithForms: false,
          assistWithDocuments: false,
          assistWithSupport: false,
          appointmentNeeded: false,
          appointmentContact: null,
          openingTimesDetails: [
            {
              dayOfWeek: 'EVERYDAY',
              openingTime: '09:00:00',
              closingTime: '16:30:00',
            },
          ],
          courtTypes: null,
        },
      ],
    };

    const viewModel = service.formatData(court, 'en');
    expect(viewModel.counterService).not.toBeNull();
    expect(viewModel.counterService?.counterOpenHours).toHaveLength(1);
  });

  test('builds counter service but with no counter open hours when no opening times are provided', () => {
    const service = new CourtService();
    const court: Court = {
      ...baseCourt,
      courtCounterServiceOpeningHours: [
        {
          counterService: true,
          assistWithForms: true,
          assistWithDocuments: false,
          assistWithSupport: false,
          appointmentNeeded: false,
          appointmentContact: null,
          openingTimesDetails: [],
          courtTypes: null,
        },
      ],
    };

    const viewModel = service.formatData(court, 'en');
    expect(viewModel.counterService).not.toBeNull();
    expect(viewModel.counterService?.counterOpenHours).toHaveLength(0);
  });

  test('formatData enriches addresses with display fields', () => {
    const service = new CourtService();
    const court: Court = {
      ...baseCourt,
      courtAddresses: [
        {
          addressLine1: 'Line 1',
          addressLine2: null,
          townCity: 'Town',
          county: null,
          postcode: 'AB1 2CD',
          epimId: null,
          lat: 51.5,
          lon: -0.1,
          addressType: 'VISIT_US',
          areasOfLaw: [
            {
              name: 'Civil',
              nameCy: 'Sifil',
              externalLink: null,
              externalLinkCy: null,
              displayName: null,
              displayNameCy: null,
            },
          ],
          courtTypes: [{ name: 'Crown' }],
        },
      ],
    };

    const viewModel = service.formatData(court, 'en');
    const address = viewModel.courtAddresses[0] as (typeof viewModel.courtAddresses)[number] & {
      formattedAddressLines: string[];
      formattedAddressTags: string[];
      directionsUrl: string | null;
    };

    expect(address.formattedAddressLines).toEqual(['Line 1', 'Town', 'AB1 2CD']);
    expect(address.formattedAddressTags).toEqual(['Civil', 'Crown']);
    expect(address.directionsUrl).toBe('https://www.google.com/maps?q=51.5,-0.1');
  });
});
