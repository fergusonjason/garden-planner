import { Injectable, inject, signal, computed } from '@angular/core';
import { IndexedDbService } from './indexed-db.service';
import { SupabaseService } from './supabase.service';
import { type Country } from '@shared/constants/countries';
import { type UsdaZoneRecord } from '@shared/models/usda-zone';

const BUCKET = 'GP-Default-Data';

interface RefDataMetadata {
  version: string;
}

@Injectable({ providedIn: 'root' })
export class UiService {
  private readonly idb = inject(IndexedDbService);
  private readonly supabase = inject(SupabaseService);

  readonly countries = signal<readonly Country[]>([]);
  readonly growingZones = signal<readonly UsdaZoneRecord[]>([]);

  /** Distinct sorted zone codes derived from the full zipcode dataset. */
  readonly uniqueZones = computed(() => {
    const seen = new Set<string>();
    const result: UsdaZoneRecord[] = [];
    for (const record of this.growingZones()) {
      if (!seen.has(record.zone)) {
        seen.add(record.zone);
        result.push(record);
      }
    }
    return result.sort((a, b) => a.zone.localeCompare(b.zone));
  });

  async initialize(): Promise<void> {
    try {
      const storedVersion = await this.idb.get<string>('meta:version');

      const { version } = await this.downloadJson<RefDataMetadata>('metadata.json.gz');

      if (storedVersion !== version) {
        await this.downloadAndStore(version);
      }

      const countries = await this.idb.get<Country[]>('countries');
      const growingZones = await this.idb.get<UsdaZoneRecord[]>('usda-zones');

      if (countries?.length) this.countries.set(countries);
      if (growingZones?.length) this.growingZones.set(growingZones);
    } catch (err) {
      console.error('[UiService] Initialization failed:', err);
    }
  }

  lookupZoneByZipcode(zipcode: string): UsdaZoneRecord | undefined {
    return this.growingZones().find(r => r.zipcode === zipcode);
  }

  private async downloadAndStore(version: string): Promise<void> {
    const [countries, growingZones] = await Promise.all([
      this.downloadJson<Country[]>('countries.json.gz'),
      this.downloadJson<UsdaZoneRecord[]>('usda-zones.json.gz')
    ]);

    await Promise.all([
      this.idb.set('countries', countries),
      this.idb.set('usda-zones', growingZones),
      this.idb.set('meta:version', version)
    ]);
  }

  private async downloadJson<T>(path: string): Promise<T> {
    const { data, error } = await this.supabase.client.storage
      .from(BUCKET)
      .download(path);

    if (error) throw error;

    const blob = data!;

    if (path.endsWith('.gz')) {
      const ds = new DecompressionStream('gzip');
      const text = await new Response(blob.stream().pipeThrough(ds)).text();
      return JSON.parse(text) as T;
    }

    return JSON.parse(await blob.text()) as T;
  }
}
