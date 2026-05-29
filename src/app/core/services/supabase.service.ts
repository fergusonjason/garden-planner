import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  private readonly supabase: SupabaseClient<any, 'gp'>;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
      auth: { storage: window.sessionStorage },
      db: { schema: "gp"}
    });
  }

  get client(): SupabaseClient<any, 'gp'> {
    return this.supabase;
  }
}