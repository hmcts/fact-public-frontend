const ACTIONS = new Set(['nearest', 'documents', 'update', 'not-listed']);
const SINGLE_LETTER_PREFIX = /^[a-z]$/i;

const VALID_POSTCODE_REGEX = /^[A-Z]{1,2}\d{1,2}[A-Z]? ?\d[A-Z]{2}$/i;
const POSTCODE_WITHOUT_SPACE_REGEX = /^[A-Z]{1,2}\d{1,2}[A-Z]?\d[A-Z]{2}$/i;

const SCOTLAND_POSTCODE_REGEX = /^(ZE|KW|IV|HS|PH|AB|DD|PA|FK|G\d|KY|KA|DG|TD|EH|ML)/i;
const JURISDICTION_ERROR_REGEXES = {
  northernIrelandPostcode: /^(BT)/i,
  guernseyPostcode: /^(GY)/i,
  jerseyPostcode: /^(JE)/i,
  isleOfManPostcode: /^(IM)/i,
};

const SCOTTISH_ALLOWED_SERVICE_AREAS = new Set(['immigration', 'benefits', 'claims-against-employers']);
const SCOTTISH_CHILDCARE_SERVICE_AREAS = new Set([
  'childcare-arrangements-if-you-separate-from-your-partner',
  'childcare-arrangements',
]);

export const isValidAction = (value: string): boolean => !!value && ACTIONS.has(value);

export const isValidPrefix = (value: unknown): value is string =>
  typeof value === 'string' && SINGLE_LETTER_PREFIX.test(value);

export const isValidPostcode = (value: string, serviceArea?: string): boolean =>
  checkPostcode(value, serviceArea) === undefined;

/**
 * Checks the postcode and returns an appropriate error type if there are any issues with the postcode.
 * If there are no issues, returns undefined.
 * @param postcode
 * @param serviceArea optional service-area slug used for context-aware jurisdiction rules
 */
export const checkPostcode = (postcode: string, serviceArea?: string): string | undefined => {
  // might be missing
  if (!postcode) {
    return 'blankPostcode';
  }

  // might be structurally invalid
  const trimmedPostcode = postcode.trim();
  if (trimmedPostcode.length === 0) {
    return 'blankPostcode';
  } else if (!VALID_POSTCODE_REGEX.test(trimmedPostcode)) {
    return 'invalidPostcode';
  } else if (POSTCODE_WITHOUT_SPACE_REGEX.test(trimmedPostcode)) {
    return 'missingPostcodeSpace';
  }

  const normalisedServiceArea = serviceArea?.trim().toLowerCase();

  if (SCOTLAND_POSTCODE_REGEX.test(trimmedPostcode)) {
    if (normalisedServiceArea && SCOTTISH_ALLOWED_SERVICE_AREAS.has(normalisedServiceArea)) {
      return undefined;
    }
    if (normalisedServiceArea && SCOTTISH_CHILDCARE_SERVICE_AREAS.has(normalisedServiceArea)) {
      return 'scottishChildrenPostcode';
    }
    return 'scotlandPostcode';
  }

  // might be in an unhandled jurisdiction
  for (const [key, regex] of Object.entries(JURISDICTION_ERROR_REGEXES)) {
    if (regex.test(trimmedPostcode)) {
      return key;
    }
  }

  // no obvious issues with the postcode
  return undefined;
};
