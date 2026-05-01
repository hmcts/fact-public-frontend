import { z } from 'zod';

export enum CATCHMENT_TYPES {
  LOCAL = 'LOCAL',
  NATIONAL = 'NATIONAL',
  REGIONAL = 'REGIONAL',
}

export const courtServiceAreasSchema = z.object({
  id: z.string(),
  courtId: z.string(),
  serviceAreaId: z.array(z.string()),
  catchmentType: z.enum(CATCHMENT_TYPES),
  courtName: z.string(),
  courtSlug: z.string(),
});

export type CourtServiceAreas = z.infer<typeof courtServiceAreasSchema>;
