import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { SUPABASE_KEY, SUPABASE_URL } from '@/lib/supabase/config';

const isAdminPage = (path: string) => (path === '/admin' || path.startsWith('/admin/')) && path !== '/admin/login';

/**
 * Refreshes the Supabase session cookie on every request and guards the signed-in pages.
 * The API and row-level security still check every data request; this only keeps people
 * from landing on pages they cannot use.
 */
export async function updateSession(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Supabase falls back to the Site URL (the homepage) when a redirect URL is not allowed.
  // Finish that sign-in at the callback instead of dropping the code.
  if (pathname === '/' && searchParams.has('code')) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/callback';
    if (!url.searchParams.has('next')) url.searchParams.set('next', '/open-app');
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = '';
    const res = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  const needsUser = pathname === '/' || pathname === '/home' || isAdminPage(pathname);
  let user = null;
  if (needsUser) {
    try {
      user = (await supabase.auth.getUser()).data.user;
    } catch {
      user = null;
    }
  }

  if (pathname === '/' && user) return redirectTo('/home');
  if (pathname === '/home' && !user) return redirectTo('/login');
  if (isAdminPage(pathname)) {
    if (!user) return redirectTo('/admin/login');
    const metaRole = user.user_metadata?.role;
    if (metaRole === 'owner' || metaRole === 'admin') {
      // Allowed via user metadata
    } else {
      try {
        const { data: profile, error } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
        if (error) {
          // If profiles table does not exist yet (PGRST205), allow logged in user through to /admin
          const isMissingTable = error.code === 'PGRST205' || (error.message && error.message.includes('schema cache'));
          if (!isMissingTable) return redirectTo('/open-app');
        } else if (profile?.role !== 'owner' && profile?.role !== 'admin') {
          return redirectTo('/open-app');
        }
      } catch {
        // Fallback allows access during setup
      }
    }
  }

  // City and region from Vercel's IP lookup, for Admin › Visitors (country is taken server-side).
  const geo = ['country', 'country-region', 'city'].map((k) => request.headers.get(`x-vercel-ip-${k}`) || '');
  if (geo.some(Boolean)) {
    response.cookies.set('fw_geo', geo.map((g) => { try { return decodeURIComponent(g); } catch { return g; } }).join('|'),
      { path: '/', sameSite: 'lax', maxAge: 3600 });
  }

  return response;
}
