/**
 * Returns true when the value is a non-empty string after trimming.
 */
export const hasText = (value?: string | null): value is string => typeof value === 'string' && value.trim().length > 0;
