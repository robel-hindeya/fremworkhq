import type { NextRequest } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { loginWithError, redirectWithinSite, safeNext } from '@/lib/auth-redirect';

/** OAuth (PKCE) and email links that carry a `code` finish here. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  // The provider sent the visitor back without signing in (for example, they cancelled Google).
  const providerError = params.get('error_description') || params.get('error');
  if (providerError) return loginWithError(providerError);

  const code = params.get('code');
  if (!code) return loginWithError('That sign-in link is not valid. Log in again.');

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return loginWithError('That sign-in link has expired or was already used. Log in again.');

  return redirectWithinSite(safeNext(params.get('next')));
}
