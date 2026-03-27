import { z } from 'zod';

export const courtBasicSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string().optional(),
    open: z.boolean(),
    warningNotice: z.string().nullable(),
    lastUpdatedAt: z.string(),
    openOnCath: z.boolean().nullable(),
    mrdId: z.string().nullable(),
    region: z.string(),
    isServiceCentre: z.boolean(),
  })
  .transform(court => ({
    ...court,
    slug: court.name.replace(/[\s|,]+/g, '-').toLowerCase(),
  }));

export type CourtBasic = z.infer<typeof courtBasicSchema>;
