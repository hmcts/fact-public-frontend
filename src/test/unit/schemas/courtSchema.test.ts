import { describe, expect, it } from '@jest/globals';

import { courtSchema } from '../../../main/schemas/courtSchema';

const baseCourt = {
  id: 'a',
  name: 'A Court',
  slug: 'a-court',
  open: true,
  warningNotice: null,
  warningNoticeCy: null,
  lastUpdatedAt: '2026-05-15',
  openOnCath: null,
  mrdId: null,
  region: {
    name: 'London',
    country: 'England',
  },
  courtDxCodes: [],
  courtCodes: [],
  courtFaxNumbers: [],
  courtAddresses: [],
  courtOpeningHours: [],
  courtCounterServiceOpeningHours: [],
  courtContactDetails: [],
  courtTranslations: [],
  courtFacilities: [],
  courtProfessionalInformation: [],
  courtAreasOfLaw: [],
  courtPhotos: [],
};

const buildCourtWithLiftSupportPhoneNumber = (liftSupportPhoneNumber: unknown) => ({
  ...baseCourt,
  courtAccessibilityOptions: [
    {
      accessibleParking: true,
      accessibleParkingPhoneNumber: null,
      accessibleToiletDescription: null,
      accessibleToiletDescriptionCy: null,
      accessibleEntrance: true,
      accessibleEntrancePhoneNumber: null,
      hearingEnhancementEquipment: 'INFRARED_SYSTEMS',
      lift: true,
      liftDoorWidth: null,
      liftDoorLimit: null,
      liftSupportPhoneNumber,
      quietRoom: false,
    },
  ],
});

const buildCourtWithTranslation = (email: unknown, phoneNumber: unknown) => ({
  ...baseCourt,
  courtTranslations: [{ email, phoneNumber }],
  courtAccessibilityOptions: [],
});

describe('courtSchema - translation contact details', () => {
  it('accepts null translation contact details returned by the Data API', () => {
    const result = courtSchema.safeParse(buildCourtWithTranslation('sw-cardiffmcenq@justice.gov.uk', null));

    expect(result.success).toBe(true);
  });

  it('accepts a null translation email with a supplied phone number', () => {
    const result = courtSchema.safeParse(buildCourtWithTranslation(null, '0330 808 4407'));

    expect(result.success).toBe(true);
  });

  it('continues to reject invalid translation contact value types', () => {
    const result = courtSchema.safeParse(buildCourtWithTranslation('sw-cardiffmcenq@justice.gov.uk', 12345));

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('Expected court schema parse to fail for an invalid translation phone number type');
    }

    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['courtTranslations', 0, 'phoneNumber'],
        }),
      ])
    );
  });
});

describe('courtSchema - liftSupportPhoneNumber', () => {
  it('accepts NONE as hearing enhancement equipment', () => {
    const data = buildCourtWithLiftSupportPhoneNumber(null);
    data.courtAccessibilityOptions[0].hearingEnhancementEquipment = 'NONE';

    const result = courtSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it('accepts a string value', () => {
    const result = courtSchema.safeParse(buildCourtWithLiftSupportPhoneNumber('02070000000'));

    expect(result.success).toBe(true);
  });

  it('accepts null', () => {
    const result = courtSchema.safeParse(buildCourtWithLiftSupportPhoneNumber(null));

    expect(result.success).toBe(true);
  });

  it('rejects when liftSupportPhoneNumber is missing', () => {
    const data = buildCourtWithLiftSupportPhoneNumber('02070000000');
    delete (data.courtAccessibilityOptions[0] as { liftSupportPhoneNumber?: unknown }).liftSupportPhoneNumber;

    const result = courtSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('Expected court schema parse to fail when liftSupportPhoneNumber is missing');
    }

    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['courtAccessibilityOptions', 0, 'liftSupportPhoneNumber'],
        }),
      ])
    );
  });

  it.each<{ invalidValue: unknown; label: string }>([
    { invalidValue: 12345, label: 'number' },
    { invalidValue: true, label: 'boolean' },
    { invalidValue: { phone: '02070000000' }, label: 'object' },
    { invalidValue: ['02070000000'], label: 'array' },
  ])('rejects %s value type', ({ invalidValue }) => {
    const result = courtSchema.safeParse(buildCourtWithLiftSupportPhoneNumber(invalidValue));

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('Expected court schema parse to fail for invalid liftSupportPhoneNumber type');
    }

    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['courtAccessibilityOptions', 0, 'liftSupportPhoneNumber'],
        }),
      ])
    );
  });
});
