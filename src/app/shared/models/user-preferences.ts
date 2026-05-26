import { z } from 'zod';

export const GridSizeSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive()
});

export const UserPreferencesSchema = z.object({
  preferred_units: z.enum(['feet', 'meters']).default('feet'),
  temperature_scale: z.enum(['fahrenheit', 'celsius']).default('fahrenheit'),
  country: z.string().nullish(),
  grid_size: GridSizeSchema,
  show_quick_tips: z.boolean().default(true),
  growing_zone: z.string().nullish()
});

export type GridSize = z.infer<typeof GridSizeSchema>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

export function isUserPreferences(value: unknown): value is UserPreferences {
  return UserPreferencesSchema.safeParse(value).success;
}