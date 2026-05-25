import { inject, Injectable, signal } from '@angular/core';
import { ApplicationError } from '@core/errors/application-error';
import { SupabaseService } from '@core/services/supabase.service';
import { UserService } from '@core/services/user.service';
import { SignupStatus } from '@shared/types/signup-status.type';
import { User } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly supabaseService: SupabaseService = inject(SupabaseService);
  private readonly userService = inject(UserService);

  readonly currentUser = signal<User | null>(null);

  constructor() {}

  async signUp(email: string, password: string): Promise<SignupStatus> {


    const { data, error } = await this.supabaseService.client.auth.signUp({
      email,
      password
    });

    if (error) {
      throw new ApplicationError('Failed to sign up', error);
    }

    if (data.user?.identities?.length === 0) {
      return "EXISTS";
    }

    const result = data.user ? "CONFIRMED" : "PENDING";
    return result;
  }

  async signIn(email: string, password: string): Promise<void> {

    const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new ApplicationError('Failed to sign in', error);
    }

    if (data.user ===  null) {
      throw new ApplicationError('Failed to sign in: No data returned');
    }

    this.currentUser.set(data.user);
  }

  async signOut(): Promise<void> {

    const { error } = await this.supabaseService.client.auth.signOut();
    if (error) {
      throw new ApplicationError('Failed to sign out', error);
    }
    this.currentUser.set(null);
    this.userService.clearProfile();
  }

  async getSession(): Promise<void> {

    const { data, error } = await this.supabaseService.client.auth.getSession();
    if (error) {
      throw new ApplicationError('Failed to get session', error);
    }
    this.currentUser.set(data.session?.user ?? null);
  }

  initAuthListener(): void {

    this.supabaseService.client.auth.onAuthStateChange((event, session) => {
      this.currentUser.set(session?.user ?? null);
    });
  }
}
