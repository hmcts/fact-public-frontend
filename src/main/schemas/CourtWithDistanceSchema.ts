import { z } from 'zod';

export const courtWithDistanceSchema = z.object({
  courtName: z.string(),
  courtSlug: z.string(),
  courtId: z.string(),
  distance: z.float64(),
});

export type CourtWithDistance = z.infer<typeof courtWithDistanceSchema>;
