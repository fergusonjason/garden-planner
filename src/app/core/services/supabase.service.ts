import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ApplicationError } from '@core/errors/application-error';
import { UserProfile, UserProfileSchema } from '@shared/models/user-profile';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  private readonly supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  async getProfile(userId: string): Promise<UserProfile> {

    const { data, error } = await this.supabase
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

    const result = allGood.data as UserProfile;
    return result;
  }

  async upsertProfile(profile: UserProfile): Promise<void> {

    const allGood = UserProfileSchema.safeParse(profile);

    if (!allGood.success) {
      throw new ApplicationError('Invalid user profile data', allGood.error);
    }

    const profileCopy = { ...profile };
    const now = new Date().toISOString();
    profileCopy.updated_at = now;

    const { data, error } = await this.supabase
      .from('user_profiles')
      .upsert(profileCopy, { onConflict: 'id' });


    if (error) {
      throw new ApplicationError('Failed to upsert user profile', error);
    }

  }
}
