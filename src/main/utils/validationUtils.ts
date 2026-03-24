const ACTIONS = new Set(['nearest', 'documents', 'update', 'not-listed']);

const VALID_POSTCODE_REGEX = /^[A-Z]{1,2}\d{1,2}[A-Z]? ?\d[A-Z]{2}$/i;

const JURISDICTION_ERROR_REGEXES = {
  scotlandPostcode: /^(ZE|KW|IV|HS|PH|AB|DD|PA|FK|G\d|KY|KA|DG|TD|EH|ML)/i,
  northernIrelandPostcode: /^(BT)/i,
  guernseyPostcode: /^(GY)/i,
  jerseyPostcode: /^(JE)/i,
  isleOfManPostcode: /^(IM)/i,
};

export const isValidAction = (value: string): boolean => !!value && ACTIONS.has(value);

/**
 * Checks the postcode and returns an appropriate error type if there are any issues with the postcode.
 * If there are no issues, returns null.
 * @param postcode
 */
export const checkPostcode = (postcode: string): string | null => {
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
  }

  // might be in an unhandled jurisdiction
  for (const [key, regex] of Object.entries(JURISDICTION_ERROR_REGEXES)) {
    if (regex.test(trimmedPostcode)) {
      return key;
    }
  }

  // no obvious issues with the postcode
  return null;
};
