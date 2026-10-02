import { z } from 'zod';

export enum SEARCH_RESULT_TYPES {
  COURT = 'COURT',
  SERVICE_CENTRE = 'SERVICE_CENTRE',
}

const baseSearchResultSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  distance: z.float64().nonnegative(),
});

const courtSearchResultSchema = baseSearchResultSchema.extend({
  type: z.literal(SEARCH_RESULT_TYPES.COURT),
});

const serviceCentreSearchResultSchema = baseSearchResultSchema.extend({
  type: z.literal(SEARCH_RESULT_TYPES.SERVICE_CENTRE),
});

export const searchResultSchema = z.discriminatedUnion('type', [
  courtSearchResultSchema,
  serviceCentreSearchResultSchema,
]);

export type SearchResult = z.infer<typeof searchResultSchema>;
