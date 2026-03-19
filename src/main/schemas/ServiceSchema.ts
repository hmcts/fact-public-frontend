import { z } from 'zod';

export const serviceSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string().optional(),
    nameCy: z.string(),
    description: z.string().nullable(),
    descriptionCy: z.string().nullable(),
    serviceAreas: z.array(z.string()),
  })
  .transform(service => ({
    ...service,
    slug: service.name.replace(/[\s|,]+/g, '-').toLowerCase(),
  }));

export type Service = z.infer<typeof serviceSchema>;
