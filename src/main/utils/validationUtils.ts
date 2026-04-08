const ACTIONS = new Set(['nearest', 'documents', 'update', 'not-listed']);

export const isValidAction = (value: string): boolean => !!value && ACTIONS.has(value);
