const ACTIONS = new Set(['nearest', 'documents', 'update', 'not-listed']);
const SINGLE_LETTER_PREFIX = /^[a-z]$/i;

const VALID_POSTCODE_REGEX = /^[A-Z]{1,2}\d{1,2}[A-Z]? ?\d[A-Z]{2}$/i;
const POSTCODE_WITHOUT_SPACE_REGEX = /^[A-Z]{1,2}\d{1,2}[A-Z]?\d[A-Z]{2}$/i;

// Bounded length guard before regex/downstream calls.
// A complete UK postcode contains between 5 and 7 characters (excluding the space),
// or 6 to 8 characters including the mandatory middle space.
const POSTCODE_MIN_LEN = 5;
const POSTCODE_MAX_LEN = 8;

const SCOTLAND_POSTCODE_REGEX = /^(ZE|KW|IV|HS|PH|AB|DD|PA|FK|G\d|KY|KA|DG|TD|EH|ML)/i;
const JURISDICTION_ERROR_REGEXES = {
  northernIrelandPostcode: /^(BT)/i,
  guernseyPostcode: /^(GY)/i,
  jerseyPostcode: /^(JE)/i,
  isleOfManPostcode: /^(IM)/i,
};

const SCOTTISH_ALLOWED_SERVICE_AREAS = new Set(['immigration-and-asylum', 'benefits', 'claims-against-employers']);
const SCOTTISH_CHILDCARE_SERVICE_AREAS = new Set([
  'childcare-arrangements-if-you-separate-from-your-partner',
  'childcare-arrangements',
]);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isValidAction = (value: string): boolean => !!value && ACTIONS.has(value);

export const isValidPrefix = (value: unknown): value is string =>
  typeof value === 'string' && SINGLE_LETTER_PREFIX.test(value);

/**
 * Checks the postcode and returns an appropriate error type if there are any issues with the postcode.
 * If there are no issues, returns undefined.
 * @param postcode unknown boundary input
 * @param serviceArea optional service-area slug used for context-aware jurisdiction rules
 */
export const checkPostcode = (postcode: unknown, serviceArea?: string): string | undefined => {
  // must be exactly one string at boundary
  if (typeof postcode !== 'string') {
    return 'blankPostcode';
  }

  const trimmedPostcode = postcode.trim().toUpperCase();

  if (trimmedPostcode.length === 0) {
    return 'blankPostcode';
  }
  // Cheap bounds first.
  else if (trimmedPostcode.length < POSTCODE_MIN_LEN || trimmedPostcode.length > POSTCODE_MAX_LEN) {
    return 'invalidPostcode';
  } else if (!VALID_POSTCODE_REGEX.test(trimmedPostcode)) {
    return 'invalidPostcode';
  } else if (POSTCODE_WITHOUT_SPACE_REGEX.test(trimmedPostcode)) {
    return 'missingPostcodeSpace';
  }

  const normalisedServiceArea = serviceArea?.trim().toLowerCase();

  if (SCOTLAND_POSTCODE_REGEX.test(trimmedPostcode)) {
    if (normalisedServiceArea && SCOTTISH_CHILDCARE_SERVICE_AREAS.has(normalisedServiceArea)) {
      return 'scottishChildrenPostcode';
    }
    if (normalisedServiceArea && SCOTTISH_ALLOWED_SERVICE_AREAS.has(normalisedServiceArea)) {
      return undefined;
    }
    return 'scotlandPostcode';
  }

  for (const [key, regex] of Object.entries(JURISDICTION_ERROR_REGEXES)) {
    if (regex.test(trimmedPostcode)) {
      return key;
    }
  }

  // no obvious issues with the postcode
  return undefined;
};

/**
 * Checks whether a value is a UUID in the format expected by the API.
 */
export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}
