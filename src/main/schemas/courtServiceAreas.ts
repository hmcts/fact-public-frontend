import { z } from 'zod';

import { SEARCH_RESULT_TYPES } from './searchResult';

export enum CATCHMENT_TYPES {
  LOCAL = 'LOCAL',
  NATIONAL = 'NATIONAL',
  REGIONAL = 'REGIONAL',
}

export const serviceAreaSearchResultSchema = z.object({
  id: z.string(),
  serviceCentreId: z.string(),
  serviceCentreName: z.string(),
  serviceCentreSlug: z.string(),
  serviceAreaIds: z.array(z.string()),
  catchmentType: z.enum(CATCHMENT_TYPES).nullable(),
  type: z.enum(SEARCH_RESULT_TYPES),
});

export const courtServiceAreasSchema = serviceAreaSearchResultSchema;

export type ServiceAreaSearchResult = z.infer<typeof serviceAreaSearchResultSchema>;
export type CourtServiceAreas = ServiceAreaSearchResult;
