import { z } from 'zod';

export const UserProfileSchema = z.object({
  id: z.uuid(),
  display_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  preferences: z.record(z.string(), z.unknown()).nullable(),
  custom_plants: z.record(z.string(), z.unknown()).nullable(),
  subscription: z.string().nullable(),
  created_at: z.iso.datetime().nullable(),
  updated_at: z.iso.datetime().nullable()
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

export function isUserProfile(value: unknown): value is UserProfile {
  return UserProfileSchema.safeParse(value).success;
}