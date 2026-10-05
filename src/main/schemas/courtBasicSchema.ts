import { z } from 'zod';

const isoDateStringSchema = z.iso.datetime({ offset: true });
export const courtBasicSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  open: z.boolean(),
  warningNotice: z.string().nullable(),
  warningNoticeCy: z.string().nullable(),
  createdAt: isoDateStringSchema.nullable().optional(),
  lastUpdatedAt: isoDateStringSchema,
  openOnCath: z.boolean().nullable(),
  mrdId: z.string().nullable(),
  regionId: z.uuid(),
  serviceCentre: z.boolean().optional(),
  locationType: z.enum(['COURT', 'SERVICE_CENTRE']).optional(),
});

export type CourtBasic = z.infer<typeof courtBasicSchema>;
