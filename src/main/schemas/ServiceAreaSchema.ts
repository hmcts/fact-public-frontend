import { z } from 'zod';

const catchmentMethodSchema = z.enum([
  'POSTCODE',
  'PROXIMITY',
  'LOCAL_AUTHORITY'
]);

const typeSchema = z.enum([
  'CIVIL',
  'FAMILY',
  'OTHER'
]);

export const serviceAreaSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameCy: z.string(),
  description: z.string().nullable(),
  descriptionCy: z.string().nullable(),
  onlineUrl: z.string().nullable(),
  onlineText: z.string().nullable(),
  onlineTextCy: z.string().nullable(),
  text: z.string().nullable(),
  textCy: z.string().nullable(),
  catchmentMethod: catchmentMethodSchema.nullable(),
  areaOfLawId: z.string(),
  type: typeSchema.nullable(),
  sortOrder: z.int().nullable()
});

export type ServiceArea = z.infer<typeof serviceAreaSchema>;
