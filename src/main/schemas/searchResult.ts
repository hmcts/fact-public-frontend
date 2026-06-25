import { z } from 'zod';

export enum SEARCH_RESULT_TYPES {
  COURT = 'COURT',
  SERVICE_CENTRE = 'SERVICE_CENTRE',
}

export const searchResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  distance: z.float64(),
  type: z.enum(SEARCH_RESULT_TYPES),
});

export type SearchResult = z.infer<typeof searchResultSchema>;
