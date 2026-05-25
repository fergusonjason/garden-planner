import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AuthService } from '@core/services/auth.service';
import { SupabaseService } from '@core/services/supabase.service';

const mockSupabaseService = {
  client: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn()
    }
  }
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseService, useValue: mockSupabaseService }
      ]
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialise currentUser as null', () => {
    expect(service.currentUser()).toBeNull();
  });

  it('should sign up with email and password', () => {
    // TODO: implement
  });

  it('should sign in with email and password', () => {
    // TODO: implement
  });

  it('should sign out', () => {
    // TODO: implement
  });

  it('should restore session on getSession', () => {
    // TODO: implement
  });

  it('should update currentUser when auth state changes', () => {
    // TODO: implement
  });
});