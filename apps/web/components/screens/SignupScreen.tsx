'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { authMessage, UNREACHABLE } from '@/lib/auth-errors';
import { EMAIL_RE } from '@/lib/format';
import { isUsernameEmail, normalizeUsername, usernameEmail, usernameProblem } from '@/lib/username';
import { identifyVisitor } from '@/components/VisitTracker';
import {
  AuthCard, Asterisk, GoogleButton, MIN_PASSWORD, OrDivider, PasswordField, Spinner, TextField,
  callbackUrl, darkButtonStyle, noticeStyle,
} from '@/components/screens/auth-parts';

type Errors = Partial<Record<'name' | 'email' | 'password' | 'confirm', string>>;

/** Create an account, backed by Supabase Auth. Uses the Log in card styles. */
export function SignupScreen() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState('');

  // Already signed in: nothing to create.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) router.replace('/open-app'); }, () => undefined);
  }, [supabase, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const em = email.trim();
    const isUsername = !em.includes('@');
    const next: Errors = {};
    if (!name.trim()) next.name = 'Enter your name.';
    if (!em) next.email = 'Enter an email or pick a username.';
    else if (isUsername) next.email = usernameProblem(em) || undefined;
    else if (!EMAIL_RE.test(em) || isUsernameEmail(em)) next.email = 'Enter a valid email, like you@company.com.';
    if (password.length < MIN_PASSWORD) next.password = `Use at least ${MIN_PASSWORD} characters.`;
    else if (confirm !== password) next.confirm = 'The passwords do not match.';
    setErrors(next);
    setNotice('');
    if (Object.values(next).some(Boolean)) return;

    setLoading(true);
    if (isUsername) return createWithUsername(normalizeUsername(em));
    const { data, error } = await supabase.auth.signUp({
      email: em,
      password,
      options: { data: { full_name: name.trim(), company: company.trim() || undefined, role: 'owner' }, emailRedirectTo: callbackUrl() },
    });
    setLoading(false);
    if (error) return setNotice(authMessage(error));
    identifyVisitor(em);
    if (data.session) {
      router.replace('/open-app');
      router.refresh();
      return;
    }
    // Email confirmation is on. The same message shows for an address that already has an account,
    // so the form does not reveal who has signed up.
    setSentTo(em);
  };

  /** No email: the server creates the account (already confirmed), then we sign in as usual. */
  const createWithUsername = async (username: string) => {
    try {
      const res = await fetch('/api/auth/username-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, name: name.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message = (body as { message?: string }).message || 'We could not create the account. Try again.';
        setLoading(false);
        return res.status === 409 || res.status === 400 ? setErrors({ email: message }) : setNotice(message);
      }
      const { error } = await supabase.auth.signInWithPassword({ email: usernameEmail(username), password });
      if (error) {
        setLoading(false);
        return setNotice(`Your account is ready. Log in with the username ${username}.`);
      }
      router.replace('/open-app');
      router.refresh();
    } catch {
      setLoading(false);
      setNotice(UNREACHABLE);
    }
  };

  const onGoogle = async () => {
    setNotice('');
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: callbackUrl() } });
    if (error) setNotice(authMessage(error));
  };

  if (sentTo) {
    return (
      <AuthCard mood="grin">
        <Asterisk />
        <h1 style={{ margin: '18px 0 0', fontSize: '30px', lineHeight: 1.15, letterSpacing: '-0.03em', fontWeight: 600 }}>Check your email</h1>
        <p style={{ margin: '10px 0 0', fontSize: '14px', lineHeight: '22px', color: '#5E5E5E' }}>
          We sent a confirmation link to <strong style={{ color: '#0A0A0A' }}>{sentTo}</strong>. Open it to finish creating your account.
        </p>
        <p style={{ margin: '26px 0 0', fontSize: '13px', color: '#8C8C8C' }}>
          Already confirmed? <Link href="/login" className="accent-lnk">Log in</Link>
        </p>
      </AuthCard>
    );
  }

  const clear = (k: keyof Errors) => setErrors((x) => ({ ...x, [k]: undefined }));

  return (
    <AuthCard mood={Object.values(errors).some(Boolean) ? 'o' : ''}>
      <Asterisk />
      <h1 style={{ margin: '18px 0 0', fontSize: '30px', lineHeight: 1.15, letterSpacing: '-0.03em', fontWeight: 600 }}>Create your account</h1>
      <p style={{ margin: '10px 0 0', fontSize: '14px', lineHeight: '22px', color: '#8C8C8C' }}>
        Ask your numbers anything, from cash and margin to overdue invoices, in one place.
      </p>
      <form onSubmit={onSubmit} noValidate style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <TextField id="su-name" label="Your name" autoComplete="name" placeholder="Your name" value={name} error={errors.name}
          onChange={(e) => { setName(e.target.value); clear('name'); }} />
        <TextField id="su-email" label="Email or username" type="text" autoComplete="username" placeholder="you@company.com or a username" value={email}
          error={errors.email} onChange={(e) => { setEmail(e.target.value); clear('email'); }} />
        {!errors.email && email.trim() && !email.includes('@') ? (
          <p style={{ margin: '-6px 0 0', fontSize: '12px', lineHeight: '18px', color: '#8C8C8C' }}>
            No email needed. Without one, a forgotten password cannot be reset, so keep it safe.
          </p>
        ) : null}
        <TextField id="su-company" label="Company" hint="(optional)" autoComplete="organization" placeholder="Your company" value={company}
          onChange={(e) => setCompany(e.target.value)} />
        <PasswordField id="su-pass" label="Password" autoComplete="new-password" placeholder={`At least ${MIN_PASSWORD} characters`} value={password}
          error={errors.password} onChange={(v) => { setPassword(v); clear('password'); }} />
        <PasswordField id="su-confirm-pass" label="Confirm password" autoComplete="new-password" placeholder="Re-enter password" value={confirm}
          error={errors.confirm} onChange={(v) => { setConfirm(v); clear('confirm'); }} />
        <button type="submit" className="btn-dark" disabled={loading} aria-busy={loading} style={darkButtonStyle}>
          {loading ? <Spinner /> : null}
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <OrDivider />
      <GoogleButton onClick={onGoogle} disabled={loading} />
      {notice ? <p className="fade" role="status" style={noticeStyle}>{notice}</p> : null}
      <p style={{ margin: '22px 0 0', textAlign: 'center', fontSize: '13px', color: '#8C8C8C' }}>
        Already have an account? <Link href="/login" className="accent-lnk">Log in</Link>
      </p>
    </AuthCard>
  );
}
