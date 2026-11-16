import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loggedInCookie = request.cookies.get('fw_logged_in')?.value;

  if (pathname === '/' && loggedInCookie === '1') {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return updateSession(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
