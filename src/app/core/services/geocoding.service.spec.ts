import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { GeocodingService } from './geocoding.service';
import { SupabaseService } from './supabase.service';

const mockInvoke = vi.fn();

const mockSupabaseService = {
  client: {
    functions: {
      invoke: mockInvoke
    }
  }
};

describe('GeocodingService', () => {
  let service: GeocodingService;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseService, useValue: mockSupabaseService }
      ]
    });
    service = TestBed.inject(GeocodingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return zip code on success', async () => {
    mockInvoke.mockResolvedValue({ data: { zip: '90210' }, error: null });

    const result = await service.lookupZip(34.0901, -118.4065);

    expect(result).toBe('90210');
    expect(mockInvoke).toHaveBeenCalledWith('census-geocode', {
      body: { lat: 34.0901, lng: -118.4065 }
    });
  });

  it('should return null when zip is null in response', async () => {
    mockInvoke.mockResolvedValue({ data: { zip: null }, error: null });

    const result = await service.lookupZip(0, 0);

    expect(result).toBeNull();
  });

  it('should throw when the edge function returns an error', async () => {
    const edgeError = new Error('Function error');
    mockInvoke.mockResolvedValue({ data: null, error: edgeError });

    await expect(service.lookupZip(34.0901, -118.4065)).rejects.toThrow('Function error');
  });
});
