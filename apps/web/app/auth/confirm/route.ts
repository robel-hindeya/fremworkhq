import type { EmailOtpType } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { loginWithError, redirectWithinSite, safeNext } from '@/lib/auth-redirect';

const TYPES: EmailOtpType[] = ['email', 'signup', 'invite', 'recovery', 'email_change', 'magiclink'];

/** Confirmation, invite and password reset emails link here with a one-time token hash. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get('token_hash');
  const type = params.get('type') as EmailOtpType | null;
  if (!tokenHash || !type || !TYPES.includes(type)) return loginWithError('That email link is not valid. Log in again.');

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) return loginWithError('That email link has expired or was already used. Log in again.');

  return redirectWithinSite(safeNext(params.get('next')));
}
