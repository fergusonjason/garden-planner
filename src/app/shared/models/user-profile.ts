import { z } from 'zod';
import { UserPreferencesSchema } from './user-preferences';

export const UserProfileSchema = z.object({
  id: z.uuid(),
  display_name: z.string().nullish(),
  avatar_url: z.string().nullish(),
  preferences: UserPreferencesSchema.nullish(),
  custom_plants: z.record(z.string(), z.unknown()).nullish(),
  subscription_type: z.string().nullish(),
  date_created: z.iso.datetime({ offset: true }).nullish(),
  date_updated: z.iso.datetime({ offset: true }).nullish()
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

export function isUserProfile(value: unknown): value is UserProfile {
  return UserProfileSchema.safeParse(value).success;
}