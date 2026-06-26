import { z } from 'zod';

export const courtBasicSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  open: z.boolean(),
  warningNotice: z.string().nullable(),
  lastUpdatedAt: z.string(),
  openOnCath: z.boolean().nullable(),
  mrdId: z.string().nullable(),
  region: z.string(),
});

export type CourtBasic = z.infer<typeof courtBasicSchema>;
