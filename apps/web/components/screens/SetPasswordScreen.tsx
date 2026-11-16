'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { authMessage } from '@/lib/auth-errors';
import { AuthCard, Asterisk, MIN_PASSWORD, PasswordField, Spinner, darkButtonStyle, noticeStyle } from '@/components/screens/auth-parts';

/** Where invite and password reset links land (after /auth/confirm signs the person in). */
export function SetPasswordScreen() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState<string | null | undefined>(undefined);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null), () => setEmail(null));
  }, [supabase]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const next: typeof errors = {};
    if (password.length < MIN_PASSWORD) next.password = `Use at least ${MIN_PASSWORD} characters.`;
    else if (confirm !== password) next.confirm = 'The passwords do not match.';
    setErrors(next);
    setNotice('');
    if (Object.keys(next).length) return;

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return setNotice(authMessage(error));
    setDone(true);
    router.replace('/open-app');
    router.refresh();
  };

  if (email === null) {
    return (
      <AuthCard mood="o">
        <Asterisk />
        <h1 style={{ margin: '18px 0 0', fontSize: '30px', lineHeight: 1.15, letterSpacing: '-0.03em', fontWeight: 600 }}>This link has ended</h1>
        <p style={{ margin: '10px 0 0', fontSize: '14px', lineHeight: '22px', color: '#5E5E5E' }}>
          Open the newest email we sent you, or ask for a new reset link from the log in page.
        </p>
        <p style={{ margin: '26px 0 0', fontSize: '13px', color: '#8C8C8C' }}>
          <Link href="/login" className="accent-lnk">Go to log in</Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard mood={done ? 'grin' : errors.password || errors.confirm ? 'o' : ''}>
      <Asterisk />
      <h1 style={{ margin: '18px 0 0', fontSize: '30px', lineHeight: 1.15, letterSpacing: '-0.03em', fontWeight: 600 }}>Set your password</h1>
      <p style={{ margin: '10px 0 0', fontSize: '14px', lineHeight: '22px', color: '#8C8C8C' }}>
        {email ? <>For <strong style={{ color: '#0A0A0A', fontWeight: 500 }}>{email}</strong>. </> : null}
        You will use it to log in next time.
      </p>
      <form onSubmit={onSubmit} noValidate style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <PasswordField id="sp-pass" label="New password" autoComplete="new-password" placeholder={`At least ${MIN_PASSWORD} characters`} value={password}
          error={errors.password} onChange={(v) => { setPassword(v); setErrors({}); }} />
        <PasswordField id="sp-confirm" label="Confirm password" autoComplete="new-password" placeholder="Re-enter password" value={confirm}
          error={errors.confirm} onChange={(v) => { setConfirm(v); setErrors({}); }} />
        <button type="submit" className="btn-dark" disabled={loading || email === undefined} aria-busy={loading} style={darkButtonStyle}>
          {loading ? <Spinner /> : null}
          {loading ? 'Saving…' : 'Save password'}
        </button>
      </form>
      {notice ? <p className="fade" role="status" style={noticeStyle}>{notice}</p> : null}
    </AuthCard>
  );
}
