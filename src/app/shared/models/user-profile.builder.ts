import { ApplicationError } from '@core/errors/application-error';
import { UserProfile, UserProfileSchema } from './user-profile';
import { UserPreferences } from './user-preferences';

export class UserProfileBuilder {

  private readonly profile: Partial<UserProfile>;

  constructor(id: string) {
    this.profile = { id };
  }

  static from(existing: UserProfile): UserProfileBuilder {
    const builder = new UserProfileBuilder(existing.id);
    Object.assign(builder.profile, existing);
    return builder;
  }

  displayName(value: string | null): this {
    this.profile.display_name = value;
    return this;
  }

  avatarUrl(value: string | null): this {
    this.profile.avatar_url = value;
    return this;
  }

  preferences(value: UserPreferences | null): this {
    this.profile.preferences = value;
    return this;
  }

  customPlants(value: Record<string, unknown> | null): this {
    this.profile.custom_plants = value;
    return this;
  }

  subscriptionType(value: string | null): this {
    this.profile.subscription_type = value;
    return this;
  }

  dateCreated(value: string | null): this {
    this.profile.date_created = value;
    return this;
  }

  dateUpdated(value: string | null): this {
    this.profile.date_updated = value;
    return this;
  }

  build(): UserProfile {
    const result = UserProfileSchema.safeParse({
      display_name: null,
      avatar_url: null,
      preferences: null,
      custom_plants: null,
      subscription_type: null,
      date_created: null,
      date_updated: null,
      ...this.profile
    });

    if (!result.success) {
      throw new ApplicationError('Invalid UserProfile', result.error);
    }

    return result.data;
  }
}