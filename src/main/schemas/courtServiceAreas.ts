import { z } from 'zod';

import { SEARCH_RESULT_TYPES } from './searchResult';

export enum CATCHMENT_TYPES {
  LOCAL = 'LOCAL',
  NATIONAL = 'NATIONAL',
  REGIONAL = 'REGIONAL',
}

export const serviceAreaSearchResultSchema = z.object({
  id: z.uuid(),
  serviceCentreId: z.uuid(),
  serviceCentreName: z.string(),
  serviceCentreSlug: z.string(),
  serviceAreaIds: z.array(z.uuid()),
  catchmentType: z.enum(CATCHMENT_TYPES).nullable(),
  type: z.literal(SEARCH_RESULT_TYPES.SERVICE_CENTRE),
});

export type ServiceAreaSearchResult = z.infer<typeof serviceAreaSearchResultSchema>;
