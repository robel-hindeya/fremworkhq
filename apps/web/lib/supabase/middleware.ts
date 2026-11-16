import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { SUPABASE_KEY, SUPABASE_URL } from '@/lib/supabase/config';

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  // City and region from Vercel's IP lookup, for Admin › Visitors (country is taken server-side).
  const geo = ['country', 'country-region', 'city'].map((k) => request.headers.get(`x-vercel-ip-${k}`) || '');
  if (geo.some(Boolean)) {
    response.cookies.set('fw_geo', geo.map((g) => { try { return decodeURIComponent(g); } catch { return g; } }).join('|'),
      { path: '/', sameSite: 'lax', maxAge: 3600 });
  }

  return response;
}
