import { inject, Injectable, signal } from '@angular/core';
import { ApplicationError } from '@core/errors/application-error';
import { UserProfile, UserProfileSchema } from '@shared/models/user-profile';
import { UserPreferences } from '@shared/models/user-preferences';
import { UserProfileBuilder } from '@shared/models/user-profile.builder';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private readonly supabaseService = inject(SupabaseService);
  private readonly cachedProfile = signal<UserProfile | null>(null);

  get profile(): UserProfile | null {
    return this.cachedProfile();
  }

  async getProfile(userId: string): Promise<UserProfile> {

    const cached = this.cachedProfile();
    if (cached !== null) {
      return cached;
    }

    const { data, error } = await this.supabaseService.client
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw new ApplicationError('Failed to fetch user profile', error);
    }

    const allGood = UserProfileSchema.safeParse(data);

    if (!allGood.success) {
      throw new ApplicationError('Invalid user profile data', allGood.error);
    }

    this.cachedProfile.set(allGood.data);
    return allGood.data;
  }

  async upsertProfile(profile: UserProfile): Promise<void> {

    const allGood = UserProfileSchema.safeParse(profile);

    if (!allGood.success) {
      throw new ApplicationError('Invalid user profile data', allGood.error);
    }

    const profileCopy = { ...profile };
    profileCopy.date_updated = new Date().toISOString();

    const { error } = await this.supabaseService.client
      .from('user_profiles')
      .upsert(profileCopy, { onConflict: 'id' });

    if (error) {
      throw new ApplicationError('Failed to upsert user profile', error);
    }

    this.cachedProfile.set(profileCopy);
  }

  async updatePreferences(preferences: UserPreferences): Promise<void> {
    const profile = this.cachedProfile();
    if (!profile) {
      throw new ApplicationError('Cannot update preferences: no profile loaded');
    }
    const updated = UserProfileBuilder.from(profile).preferences(preferences).build();
    await this.upsertProfile(updated);
  }

  clearProfile(): void {
    this.cachedProfile.set(null);
  }
}