import { inject, Injectable } from '@angular/core';

import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class GeocodingService {

  private readonly supabase = inject(SupabaseService).client;

  async lookupZip(lat: number, lng: number): Promise<string | null> {

    const { data, error } = await this.supabase.functions.invoke('geocodio', {
      body: { lat, lng }
    });

    if (error) throw error;

    const result = (data as { zip: string | null })?.zip ?? null;
    return result;
  }
}
