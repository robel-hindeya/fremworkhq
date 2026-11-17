import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { SUPABASE_URL } from '@/lib/supabase/config';
import { normalizeUsername, usernameEmail, usernameProblem } from '@/lib/username';

/**
 * Creates an account from a username and password, with no email. Supabase only allows that
 * through its admin API, so this runs on the server with FREMWORK_SUPABASE_SECRET_KEY, a
 * server-only variable (no NEXT_PUBLIC_ prefix, never sent to the browser). The browser then
 * signs in with the normal Supabase password login.
 */
export const dynamic = 'force-dynamic';

const MIN_PASSWORD = 8;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
// Best effort: each serverless instance keeps its own count. Supabase still limits sign-ins.
const attempts = new Map<string, number[]>();

function tooMany(ip: string) {
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  attempts.set(ip, recent);
  if (attempts.size > 5000) attempts.clear();
  return recent.length > MAX_PER_WINDOW;
}

const fail = (status: number, message: string) => NextResponse.json({ message }, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: NextRequest) {
  // Only this site's own pages may create accounts.
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  if (!origin || !host || new URL(origin).host !== host) return fail(403, 'Sign up from the Fremwork website.');

  const secret = process.env.FREMWORK_SUPABASE_SECRET_KEY;
  if (!secret) return fail(503, 'Sign-up with a username is not set up on this site yet. Use an email for now.');

  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'local';
  if (tooMany(ip)) return fail(429, 'Too many sign-ups from this connection. Try again in a few minutes.');

  let body: { username?: unknown; password?: unknown; name?: unknown };
  try {
    body = await request.json();
  } catch {
    return fail(400, 'Enter a username and password.');
  }
  const username = typeof body.username === 'string' ? normalizeUsername(body.username) : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 200) : '';
  const problem = usernameProblem(username);
  if (problem) return fail(400, problem);
  if (password.length < MIN_PASSWORD || password.length > 72) return fail(400, `Use a password of ${MIN_PASSWORD}–72 characters.`);

  const admin = createClient(SUPABASE_URL, secret, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error } = await admin.auth.admin.createUser({
    email: usernameEmail(username),
    password,
    email_confirm: true, // nothing to confirm: the address is a placeholder
    user_metadata: { full_name: name || username, username },
  });
  if (error) {
    if (/already|exists|registered/i.test(error.message)) return fail(409, 'That username is taken. Pick another one.');
    console.error(`Username sign-up failed: ${error.message}`);
    return fail(502, 'We could not create the account right now. Try again in a minute.');
  }
  return NextResponse.json({ ok: true }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}
