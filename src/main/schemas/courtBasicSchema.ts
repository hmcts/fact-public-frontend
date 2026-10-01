import { z } from 'zod';

const nullableStringSchema = z.string().nullable().optional();
export const courtBasicSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  open: z.boolean(),
  warningNotice: z.string().nullable(),
  warningNoticeCy: z.string().nullable(),
  createdAt: nullableStringSchema,
  lastUpdatedAt: z.string(),
  openOnCath: z.boolean().nullable(),
  mrdId: z.string().nullable(),
  regionId: z.uuid(),
  serviceCentre: z.boolean().optional(),
  locationType: z.enum(['COURT', 'SERVICE_CENTRE']).optional(),
});

export type CourtBasic = z.infer<typeof courtBasicSchema>;
