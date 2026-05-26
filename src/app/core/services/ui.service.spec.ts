import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { UiService } from './ui.service';
import { IndexedDbService } from './indexed-db.service';
import { SupabaseService } from './supabase.service';
import { type UsdaZoneRecord } from '@shared/models/usda-zone';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({}))
}));

const mockZones: UsdaZoneRecord[] = [
  { zipcode: '10001', zone: '7a', zonetitle: '7a: 0 to 5', trange: '0 to 5', city: 'New York', state: 'NY' },
  { zipcode: '10002', zone: '7a', zonetitle: '7a: 0 to 5', trange: '0 to 5', city: 'New York', state: 'NY' },
  { zipcode: '90210', zone: '9b', zonetitle: '9b: 25 to 30', trange: '25 to 30', city: 'Beverly Hills', state: 'CA' },
];

const mockCountries = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
];

function makeIdbMock(overrides: Partial<IndexedDbService> = {}): Partial<IndexedDbService> {
  return {
    get: vi.fn().mockResolvedValue(undefined),
    set: vi.fn().mockResolvedValue(undefined),
    ...overrides
  };
}

function makeSupabaseMock(downloadResult: { data: Blob | null; error: unknown }): Partial<SupabaseService> {
  return {
    client: {
      storage: {
        from: vi.fn().mockReturnValue({ download: vi.fn().mockResolvedValue(downloadResult) })
      }
    } as unknown as SupabaseService['client']
  };
}

describe('UiService', () => {
  let service: UiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UiService,
        { provide: IndexedDbService, useValue: makeIdbMock() },
        { provide: SupabaseService, useValue: makeSupabaseMock({ data: null, error: new Error('not configured') }) }
      ]
    });
    service = TestBed.inject(UiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialise with empty countries and growingZones signals', () => {
    expect(service.countries()).toEqual([]);
    expect(service.growingZones()).toEqual([]);
  });

  it('uniqueZones should return deduplicated zones sorted by zone code', () => {
    service.growingZones.set(mockZones);

    const unique = service.uniqueZones();
    expect(unique.map(z => z.zone)).toEqual(['7a', '9b']);
  });

  it('lookupZoneByZipcode should return the matching record', () => {
    service.growingZones.set(mockZones);

    expect(service.lookupZoneByZipcode('90210')?.city).toBe('Beverly Hills');
  });

  it('lookupZoneByZipcode should return undefined for unknown zipcode', () => {
    service.growingZones.set(mockZones);

    expect(service.lookupZoneByZipcode('00000')).toBeUndefined();
  });

  describe('initialize()', () => {
    it('should load from IDB when stored version matches remote', async () => {
      const idbMock = makeIdbMock({
        get: vi.fn().mockImplementation((key: string) => {
          if (key === 'meta:version') return Promise.resolve('1.1.0');
          if (key === 'countries') return Promise.resolve(mockCountries);
          if (key === 'usda-zones') return Promise.resolve(mockZones);
          return Promise.resolve(undefined);
        })
      });

      const metaBlob = new Blob([JSON.stringify({ version: '1.1.0' })]);
      const supabaseMock = makeSupabaseMock({ data: metaBlob, error: null });

      TestBed.overrideProvider(IndexedDbService, { useValue: idbMock });
      TestBed.overrideProvider(SupabaseService, { useValue: supabaseMock });
      service = TestBed.inject(UiService);

      await service.initialize();

      expect(service.countries()).toEqual(mockCountries);
      expect(service.growingZones()).toEqual(mockZones);
    });

    it('should not throw when storage download fails — signals stay empty', async () => {
      await expect(service.initialize()).resolves.toBeUndefined();
      expect(service.countries()).toEqual([]);
    });
  });
});
