import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({}))
}));

import { SupabaseService } from './supabase.service';

describe('SupabaseService', () => {
  let service: SupabaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SupabaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should expose the supabase client', () => {
    expect(service.client).toBeTruthy();
  });

  it('should get a user profile by id', () => {
    // TODO: implement
  });

  it('should upsert a user profile', () => {
    // TODO: implement
  });
});