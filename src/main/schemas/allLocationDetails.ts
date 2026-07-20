import { z } from 'zod';

import { courtSchema } from './courtSchema';
import { CATCHMENT_TYPES } from './courtServiceAreas';

const nullableStringSchema = z.string().nullable().optional();
const nullableNumberSchema = z.number().nullable().optional();
const allLocationCourtAreaOfLawSchema = z.object({
  name: z.string(),
  nameCy: z.string(),
  externalLink: z.string().nullable(),
  externalLinkCy: z.string().nullable(),
  displayName: z.string().nullable(),
  displayNameCy: z.string().nullable(),
});
const allLocationCourtTypeSchema = z.object({
  name: z.string(),
});
const allLocationCourtSchema = courtSchema.extend({
  courtAddresses: z.array(
    z.object({
      addressLine1: z.string(),
      addressLine2: z.string().nullable(),
      townCity: z.string(),
      county: z.string().nullable(),
      postcode: z.string(),
      epimId: z.string().nullable(),
      lat: z.number().nullable(),
      lon: z.number().nullable(),
      addressType: z.enum(['VISIT_US', 'WRITE_TO_US', 'VISIT_OR_CONTACT_US']),
      areasOfLaw: z.array(z.union([z.string(), allLocationCourtAreaOfLawSchema])).nullable(),
      courtTypes: z.array(z.union([z.string(), allLocationCourtTypeSchema])).nullable(),
    })
  ),
  courtAreasOfLaw: z.array(
    z.object({
      areasOfLaw: z.array(z.union([z.string(), allLocationCourtAreaOfLawSchema])),
    })
  ),
});

const serviceCentreAddressSchema = z.object({
  id: z.string().optional(),
  serviceCentreId: z.string().optional(),
  addressLine1: nullableStringSchema,
  addressLine2: nullableStringSchema,
  townCity: nullableStringSchema,
  county: nullableStringSchema,
  postcode: nullableStringSchema,
  lat: nullableNumberSchema,
  lon: nullableNumberSchema,
  addressType: z.string().nullable().optional(),
});

const serviceCentreContactDescriptionSchema = z
  .object({
    id: z.string().optional(),
    name: z.string(),
    nameCy: z.string(),
  })
  .nullable()
  .optional();

const serviceCentreContactDetailsSchema = z.object({
  id: z.string().optional(),
  serviceCentreId: z.string().optional(),
  explanation: nullableStringSchema,
  explanationCy: nullableStringSchema,
  email: nullableStringSchema,
  phoneNumber: nullableStringSchema,
  serviceCentreContactDescription: serviceCentreContactDescriptionSchema,
});

const serviceAreaSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameCy: z.string(),
  description: nullableStringSchema,
  descriptionCy: nullableStringSchema,
  onlineUrl: nullableStringSchema,
  onlineText: nullableStringSchema,
  onlineTextCy: nullableStringSchema,
  text: nullableStringSchema,
  textCy: nullableStringSchema,
  catchmentMethod: z.string().nullable().optional(),
  areaOfLawId: z.string(),
  type: z.string().nullable().optional(),
  sortOrder: z.number().nullable().optional(),
  hasLocal: z.boolean(),
  hasNational: z.boolean(),
  hasRegional: z.boolean(),
});

const serviceCentreAreaOfLawSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  nameCy: z.string(),
  externalLink: nullableStringSchema,
  externalLinkCy: nullableStringSchema,
  displayName: nullableStringSchema,
  displayNameCy: nullableStringSchema,
});

const serviceCentreAreasOfLawSchema = z.object({
  id: z.string().optional(),
  serviceCentreId: z.string().optional(),
  areasOfLaw: z
    .array(z.union([z.string(), serviceCentreAreaOfLawSchema]))
    .nullable()
    .optional(),
});

export const serviceCentreDetailsSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  open: z.boolean().nullable().optional(),
  warningNotice: nullableStringSchema,
  warningNoticeCy: nullableStringSchema,
  createdAt: nullableStringSchema,
  lastUpdatedAt: nullableStringSchema,
  regionId: z.string().nullable().optional(),
  serviceAreas: z
    .array(z.union([z.string(), serviceAreaSchema]))
    .nullable()
    .optional(),
  catchmentType: z.enum(CATCHMENT_TYPES).nullable().optional(),
  serviceCentreAddresses: z.array(serviceCentreAddressSchema).nullable().optional(),
  serviceCentreContactDetails: z.array(serviceCentreContactDetailsSchema).nullable().optional(),
  serviceCentreAreasOfLaw: z.array(serviceCentreAreasOfLawSchema).nullable().optional(),
});

export const allLocationDetailsSchema = z.discriminatedUnion('locationType', [
  z.object({
    locationType: z.literal('COURT'),
    serviceCentre: z.literal(false),
    court: allLocationCourtSchema,
    serviceCentreDetails: z.null(),
  }),
  z.object({
    locationType: z.literal('SERVICE_CENTRE'),
    serviceCentre: z.literal(true),
    court: z.null(),
    serviceCentreDetails: serviceCentreDetailsSchema,
  }),
]);

export type ServiceCentreDetails = z.infer<typeof serviceCentreDetailsSchema>;
export type AllLocationDetails = z.infer<typeof allLocationDetailsSchema>;
