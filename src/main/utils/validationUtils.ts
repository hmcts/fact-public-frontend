const ACTIONS = new Set(['nearest', 'documents', 'update', 'not-listed']);
const SINGLE_LETTER_PREFIX = /^[a-z]$/i;

export const isValidAction = (value: string): boolean => !!value && ACTIONS.has(value);

export const isValidPrefix = (value: unknown): value is string =>
  typeof value === 'string' && SINGLE_LETTER_PREFIX.test(value);
