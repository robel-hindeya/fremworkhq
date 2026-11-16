import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** Service-role Supabase client. Bypasses RLS, so every route that uses it must do its own checks. */
@Injectable()
export class SupabaseService {
  readonly db: SupabaseClient;
  /** False when running on the publishable key: RLS then blocks every write the API makes. */
  readonly hasServiceKey: boolean;

  constructor(config: ConfigService) {
    // Match the browser project; privileged credentials must belong to this same project.
    const url = config.get<string>('NEXT_PUBLIC_SUPABASE_URL') || config.get<string>('FREMWORK_SUPABASE_URL') || config.get<string>('SUPABASE_URL') || 'https://jwznteirgsnebvtswppu.supabase.co';
    const secret = config.get<string>('FREMWORK_SUPABASE_SECRET_KEY') || '';
    this.hasServiceKey = !!secret;
    if (!this.hasServiceKey) {
      console.error('FREMWORK_SUPABASE_SECRET_KEY is not set. Set it to the secret key of the Fremwork Supabase project.');
    }
    const key = secret || config.get<string>('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') || 'sb_publishable_jSU3BbnNVHojq0teQR8j-A_3Au5k5k6';
    this.db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  }

  private static readonly log = new Logger('Database');

  /**
   * Unwraps a Supabase response. On error the database message is logged, never sent to the caller:
   * it can name tables, columns and constraints.
   */
  static check<T>(res: { data: T; error: { message: string; code?: string } | null }): T {
    if (res.error) {
      SupabaseService.log.error(`${res.error.code ?? 'error'}: ${res.error.message}`);
      throw new InternalServerErrorException('Something went wrong on our side. Try again in a minute.');
    }
    return res.data;
  }
}
