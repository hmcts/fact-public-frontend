import { z } from 'zod';

export enum CATCHMENT_METHOD {
  POSTCODE = 'POSTCODE',
  PROXIMITY = 'PROXIMITY',
  LOCAL_AUTHORITY = 'LOCAL_AUTHORITY',
}

export enum SERVICE_AREA_TYPE {
  CIVIL = 'CIVIL',
  FAMILY = 'FAMILY',
  OTHER = 'OTHER',
}

export const serviceAreaSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string().optional(),
    nameCy: z.string(),
    description: z.string().nullable(),
    descriptionCy: z.string().nullable(),
    onlineUrl: z.string().nullable(),
    onlineText: z.string().nullable(),
    onlineTextCy: z.string().nullable(),
    text: z.string().nullable(),
    textCy: z.string().nullable(),
    catchmentMethod: z.enum(CATCHMENT_METHOD).nullable(),
    areaOfLawId: z.string(),
    type: z.enum(SERVICE_AREA_TYPE),
    sortOrder: z.int().nullable(),
    hasLocal: z.boolean(),
    hasNational: z.boolean(),
  })
  .transform(serviceArea => ({
    ...serviceArea,
    slug: serviceArea.name.replace(/[\s|,]+/g, '-').toLowerCase(),
  }));

export type ServiceArea = z.infer<typeof serviceAreaSchema>;
