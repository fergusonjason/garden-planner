import { z } from 'zod';

export const SignupStatusSchema = z.enum(['CONFIRMED', 'PENDING', 'EXISTS']);

export type SignupStatus = z.infer<typeof SignupStatusSchema>;

export function isSignupStatus(value: unknown): value is SignupStatus {
  return SignupStatusSchema.safeParse(value).success;
}