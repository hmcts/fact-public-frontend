import { z } from 'zod';

export const courtWithDistanceSchema = z.object({
  courtName: z.string(),
  courtSlug: z.string(),
  courtId: z.uuid(),
  distance: z.float64().nonnegative(),
});

export type CourtWithDistance = z.infer<typeof courtWithDistanceSchema>;
