import { z } from 'zod';

const USDA_ZONES = [
  '1a', '1b', '2a', '2b', '3a', '3b', '4a', '4b',
  '5a', '5b', '6a', '6b', '7a', '7b', '8a', '8b',
  '9a', '9b', '10a', '10b', '11a', '11b', '12a', '12b',
  '13a', '13b'
] as const;

export const UsdaZoneRecordSchema = z.object({
  zipcode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
  zone: z.enum(USDA_ZONES),
  zonetitle: z.string(),
  trange: z.string(),
  city: z.string(),
  state: z.string()
});

export type UsdaZoneRecord = z.infer<typeof UsdaZoneRecordSchema>;

export function isUsdaZoneRecord(value: unknown): value is UsdaZoneRecord {
  return UsdaZoneRecordSchema.safeParse(value).success;
}
