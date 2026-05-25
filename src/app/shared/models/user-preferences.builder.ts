import { ApplicationError } from '@core/errors/application-error';
import { GridSize, UserPreferences, UserPreferencesSchema } from './user-preferences';

export class UserPreferencesBuilder {

  private readonly prefs: Partial<UserPreferences>;

  constructor() {
    this.prefs = {};
  }

  static from(existing: UserPreferences): UserPreferencesBuilder {
    const builder = new UserPreferencesBuilder();
    Object.assign(builder.prefs, existing);
    return builder;
  }

  preferredUnits(value: 'feet' | 'meters'): this {
    this.prefs.preferred_units = value;
    return this;
  }

  gridSize(value: GridSize): this {
    this.prefs.grid_size = value;
    return this;
  }

  showQuickTips(value: boolean): this {
    this.prefs.show_quick_tips = value;
    return this;
  }

  build(): UserPreferences {
    const result = UserPreferencesSchema.safeParse({
      preferred_units: 'feet',
      ...this.prefs
    });

    if (!result.success) {
      throw new ApplicationError('Invalid UserPreferences', result.error);
    }

    return result.data;
  }
}