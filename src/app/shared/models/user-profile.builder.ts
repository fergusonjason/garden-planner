import { ApplicationError } from '@core/errors/application-error';
import { UserProfile, UserProfileSchema } from './user-profile';

export class UserProfileBuilder {

  private readonly profile: Partial<UserProfile>;

  constructor(id: string) {
    this.profile = { id };
  }

  displayName(value: string | null): this {
    this.profile.display_name = value;
    return this;
  }

  avatarUrl(value: string | null): this {
    this.profile.avatar_url = value;
    return this;
  }

  preferences(value: Record<string, unknown> | null): this {
    this.profile.preferences = value;
    return this;
  }

  customPlants(value: Record<string, unknown> | null): this {
    this.profile.custom_plants = value;
    return this;
  }

  subscription(value: string | null): this {
    this.profile.subscription = value;
    return this;
  }

  createdAt(value: string | null): this {
    this.profile.created_at = value;
    return this;
  }

  updatedAt(value: string | null): this {
    this.profile.updated_at = value;
    return this;
  }

  build(): UserProfile {
    const result = UserProfileSchema.safeParse({
      display_name: null,
      avatar_url: null,
      preferences: null,
      custom_plants: null,
      subscription: null,
      created_at: null,
      updated_at: null,
      ...this.profile
    });

    if (!result.success) {
      throw new ApplicationError('Invalid UserProfile', result.error);
    }

    return result.data;
  }
}