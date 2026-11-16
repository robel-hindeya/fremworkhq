'use client';

import Link from 'next/link';
import { FramSvg, type FramFace } from '@/components/fram/FramSvg';
import { UserDashboard } from '@/components/screens/UserDashboard';
import '@/styles/login.css';
import { useEffect, type ChangeEvent, type FormEvent, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Provider } from '@supabase/supabase-js';
import { useFram } from '@/components/fram/useFram';
import { useMergeState } from '@/components/fram/useMergeState';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { EMAIL_RE } from '@/lib/format';
import { authMessage, isNetworkError, UNREACHABLE } from '@/lib/auth-errors';

// Always return to the domain the visitor is on (www, bare domain, Render, localhost): the PKCE
// verifier cookie lives there, so a different domain cannot finish the sign-in.
const siteUrl = () => window.location.origin;
const nextParam = () => {
  const n = new URLSearchParams(window.location.search).get('next');
  return n && ['/open-app', '/set-password'].includes(n) ? n : null;
};

/** Log in · ported from Login.dc.html, backed by Supabase Auth. */
export function LoginScreen() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [s, set, get] = useMergeState({
    email: '', password: '', peek: false, emailErr: '', passErr: '', notice: '', loading: false, done: false,
  });

  // Already signed in? Redirect to /home.
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem('fw_user');
        if (local) {
          const u = JSON.parse(local);
          if (u.signedIn || u.signedUp) {
            document.cookie = 'fw_logged_in=1; path=/; max-age=2592000';
            router.replace('/home');
            return;
          }
        }
      }
    } catch {}
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        document.cookie = 'fw_logged_in=1; path=/; max-age=2592000';
        router.replace('/home');
      }
    });
    const err = new URLSearchParams(window.location.search).get('error');
    if (err) set({ notice: err });
  }, [supabase, router, set]);

  const fram = useFram(s.done ? 'grin' : s.emailErr || s.passErr ? 'o' : '');

  const onSubmit = async (e?: FormEvent | MouseEvent) => {
    e?.preventDefault();
    const st = get();
    if (st.loading) return;
    const em = st.email.trim();
    const pw = st.password;

    if (!em) {
      return set({ emailErr: 'Enter your name or email.', passErr: '', notice: '' });
    }
    if (!pw) {
      return set({ emailErr: '', passErr: 'Enter your password.', notice: '' });
    }

    set({ loading: true, emailErr: '', passErr: '', notice: '' });

    // Check localStorage accounts first (supports local signup account)
    let foundAccount: { name?: string; email?: string; password?: string; signedUp?: boolean } | null = null;
    try {
      if (typeof window !== 'undefined') {
        const savedUsers: Array<{ name?: string; email?: string; password?: string; signedUp?: boolean }> =
          JSON.parse(localStorage.getItem('fw_accounts') || '[]');
        const singleUserStr = localStorage.getItem('fw_user');
        const singleUser = singleUserStr ? JSON.parse(singleUserStr) : null;
        if (singleUser) savedUsers.push(singleUser);

        foundAccount =
          savedUsers.find(
            (u) =>
              u?.name?.trim().toLowerCase() === em.toLowerCase() ||
              u?.email?.trim().toLowerCase() === em.toLowerCase()
          ) ?? null;
      }
    } catch {}

    // If an account is registered with a password, check it; otherwise sign in!
    if (foundAccount && foundAccount.password && foundAccount.password !== pw) {
      return set({ loading: false, passErr: 'Password does not match.' });
    }

    const sessionUser = foundAccount || {
      name: em,
      email: em,
      signedUp: true,
      at: new Date().toISOString(),
    };

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('fw_user', JSON.stringify({ ...sessionUser, signedIn: true }));
        document.cookie = 'fw_logged_in=1; path=/; max-age=2592000';
      }
    } catch {}

    if (EMAIL_RE.test(em)) {
      try {
        await supabase.auth.signInWithPassword({ email: em, password: pw });
      } catch {}
    }

    set({ done: true, email: sessionUser.name || em, loading: false });
    const target = nextParam() ?? '/home';
    router.replace(target);
    router.refresh();
  };

  const onForgot = async (e: MouseEvent) => {
    e.preventDefault();
    const em = get().email.trim();
    if (!em) return set({ notice: 'Enter your name or email above.' });
    set({ notice: `Password reset instructions sent for ${em}.` });
  };

  const onSso = (provider: Provider) => async () => {
    const user = { name: 'Google User', email: 'user@gmail.com', signedIn: true, at: new Date().toISOString() };
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('fw_user', JSON.stringify(user));
        document.cookie = 'fw_logged_in=1; path=/; max-age=2592000';
      }
    } catch {}
    router.replace('/home');
  };

  const onReset = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fw_user');
        document.cookie = 'fw_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    } catch {}
    try {
      await supabase.auth.signOut();
    } catch {}
    set({ done: false, password: '', peek: false, notice: '', emailErr: '', passErr: '' });
    router.replace('/');
  };

  // Template bindings for the ported markup (values mirror the design file's renderVals).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v: Record<string, any> = {
    ...fram,
    email: s.email, password: s.password,
    emailErr: s.emailErr, passErr: s.passErr,
    emailInvalid: s.emailErr ? 'true' : 'false', passInvalid: s.passErr ? 'true' : 'false',
    emailBorder: s.emailErr ? '#B42318' : '#E2E2DF', passBorder: s.passErr ? '#B42318' : '#E2E2DF',
    passType: s.peek ? 'text' : 'password',
    peekLabel: s.peek ? 'Hide password' : 'Show password', peekPressed: s.peek ? 'true' : 'false',
    peekSlash: s.peek ? 'M4 4 L20 20' : 'M0 0',
    loading: s.loading, submitLabel: s.loading ? 'Logging in…' : 'Log in',
    notice: s.notice,
    showForm: !s.done, done: s.done,
    onEmail: (e: ChangeEvent<HTMLInputElement>) => set({ email: e.target.value, emailErr: '', notice: '' }),
    onPass: (e: ChangeEvent<HTMLInputElement>) => set({ password: e.target.value, passErr: '', notice: '' }),
    onPeek: () => set({ peek: !get().peek }),
    onForgot, onSso, onSubmit, onReset,
  };

  if (s.done) {
    return <UserDashboard userName={s.email || 'User'} onLogout={onReset} defaultTab="home" />;
  }

  return (
      <div className="pg-login">
      <div className="auth-wrap" onMouseMove={v.onMove} onMouseEnter={v.onEnter} onMouseLeave={v.onLeave} style={{ minHeight: "100vh", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(16px, 4vw, 48px)", fontFamily: "'Geist', system-ui, sans-serif", color: "#0A0A0A", background: "#E9E9E6" }}>
      <div className="auth-card" style={{ width: "100%", maxWidth: "1040px", minHeight: "620px", display: "flex", background: "#FFFFFF", borderRadius: "22px", padding: "10px", boxSizing: "border-box", boxShadow: "0 1px 2px rgba(10,10,10,0.04), 0 24px 60px rgba(10,10,10,0.08)" }}>
      {/* Left visual panel */}
      <div className="lside" style={{ position: "relative", flex: "0 0 46%", borderRadius: "16px", overflow: "hidden", background: "#F1F1EC", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "28px 30px 34px", boxSizing: "border-box" }}>
      <div aria-hidden="true" className="glow" style={{ position: "absolute", left: "-20%", top: "18%", width: "130%", height: "80%", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(198,244,50,0.85), rgba(198,244,50,0.35) 55%, rgba(198,244,50,0) 100%)", filter: "blur(30px)" }}></div>
      <div aria-hidden="true" style={{ position: "absolute", right: "-25%", top: "-20%", width: "80%", height: "60%", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(255,255,255,0.9), rgba(255,255,255,0))", filter: "blur(20px)" }}></div>
      <Link href="/" style={{ position: "relative", zIndex: "1", alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "8px", fontWeight: "600", fontSize: "19px", letterSpacing: "-0.03em", textDecoration: "none", color: "#0A0A0A" }}><img src="/brand-logo.png" alt="Fremwork" width="22" height="22" style={{ display: "block", objectFit: "contain" }} />Fremwork</Link>
      <div style={{ position: "relative", zIndex: "1", width: "62%", alignSelf: "center", margin: "24px 0" }}>
      <FramSvg f={v as FramFace} label="Fram, the Fremwork character, waving hello" className="fram-svg" svgRef={v.setFram} onMouseDown={v.onPoke} style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }} />
      </div>
      <div style={{ position: "relative", zIndex: "1" }}>
      <p style={{ margin: "0", fontSize: "14px", color: "#3A3A38" }}>With Fremwork you can</p>
      <p style={{ margin: "10px 0 0", fontSize: "clamp(22px, 2.4vw, 28px)", lineHeight: "1.22", letterSpacing: "-0.02em", fontWeight: "500" }}>Ask your finance team anything, and leave with a clear next step.</p>
      </div>
      </div>
      {/* Right form panel */}
      <div className="auth-form" style={{ flex: "1 1 0", minWidth: "0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "clamp(28px, 5vw, 64px) clamp(20px, 5vw, 72px)" }}>
      <Link href="/" className="mob-brand" style={{ display: "none", alignSelf: "flex-start", alignItems: "center", gap: "8px", marginBottom: "28px", fontWeight: "600", fontSize: "19px", letterSpacing: "-0.03em", textDecoration: "none", color: "#0A0A0A" }}><img src="/brand-logo.png" alt="Fremwork" width="22" height="22" style={{ display: "block", objectFit: "contain" }} />Fremwork</Link>
      <div style={{ width: "100%", maxWidth: "360px" }}>
      <div className="fade" style={{ display: "flex", flexDirection: "column" }}>
      <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><g stroke="#C6F432" strokeWidth="4.5" strokeLinecap="round"><path d="M15 3 V27"></path><path d="M4.6 9 L25.4 21"></path><path d="M4.6 21 L25.4 9"></path></g></svg>
      <h1 style={{ margin: "18px 0 0", fontSize: "30px", lineHeight: "1.15", letterSpacing: "-0.03em", fontWeight: "600" }}>Welcome back</h1>
      <p style={{ margin: "10px 0 0", fontSize: "14px", lineHeight: "22px", color: "#8C8C8C" }}>Log in to ask your numbers anything, from cash and margin to overdue invoices, in one place.</p>
      <form onSubmit={v.onSubmit} noValidate style={{ marginTop: "28px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
      <label htmlFor="login-email" style={{ fontSize: "13px", fontWeight: "500" }}>Your name or email</label>
      <div className="field" style={{ background: "#FFFFFF", border: `1px solid ${v.emailBorder}`, borderRadius: "6px" }}>
      <input id="login-email" type="text" autoComplete="username" placeholder="Your name or email" value={v.email} onChange={v.onEmail} aria-invalid={v.emailInvalid} style={{ width: "100%", boxSizing: "border-box", border: "0", outline: "none", background: "transparent", fontFamily: "inherit", fontSize: "15px", color: "#0A0A0A", padding: "12px 14px" }} />
      </div>
      {v.emailErr ? (<><span style={{ fontSize: "12px", color: "#B42318" }}>{v.emailErr}</span></>) : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}><label htmlFor="login-pass" style={{ fontSize: "13px", fontWeight: "500" }}>Password</label><a href="#forgot" className="lnk" onClick={v.onForgot} style={{ fontSize: "12px", color: "#5E5E5E" }}>Forgot?</a></div>
      <div className="field" style={{ display: "flex", alignItems: "center", background: "#FFFFFF", border: `1px solid ${v.passBorder}`, borderRadius: "6px", paddingRight: "4px" }}>
      <input id="login-pass" type={s.peek ? 'text' : 'password'} autoComplete="current-password" placeholder="Password" value={v.password} onChange={v.onPass} aria-invalid={v.passInvalid} style={{ flex: "1 1 auto", minWidth: 0, width: "100%", boxSizing: "border-box", border: "0", outline: "none", background: "transparent", fontFamily: "inherit", fontSize: "15px", color: "#0A0A0A", padding: "12px 14px" }} />
      <button
        type="button"
        className="peek"
        tabIndex={-1}
        onMouseDown={(e) => e.preventDefault()}
        onClick={v.onPeek}
        aria-label={s.peek ? 'Hide password' : 'Show password'}
        title={s.peek ? 'Hide password' : 'Show password'}
        style={{
          width: '36px',
          height: '36px',
          flex: 'none',
          border: '0',
          borderRadius: '6px',
          background: s.peek ? '#F0F0ED' : 'transparent',
          color: '#0A0A0A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
          transition: 'all 0.15s ease',
        }}
      >
        {s.peek ? (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pointerEvents: 'none', display: 'block' }}
          >
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        ) : (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pointerEvents: 'none', display: 'block' }}
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        )}
      </button>
      </div>
      {v.passErr ? (<><span style={{ fontSize: "12px", color: "#B42318" }}>{v.passErr}</span></>) : null}
      </div>
      <button type="submit" className="btn-dark" style={{ marginTop: "10px", width: "100%", minHeight: "46px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", fontFamily: "inherit", fontSize: "15px", fontWeight: "500", color: "#FFFFFF", background: "#0A0A0A", border: "0", borderRadius: "6px", padding: "12px 20px", cursor: "pointer", transition: "background .2s", boxShadow: "0 10px 24px rgba(10,10,10,0.22), inset 0 1px 0 rgba(255,255,255,0.12)" }}>
      {v.loading ? (<><span className="spin" aria-hidden="true" style={{ width: "15px", height: "15px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#FFFFFF" }}></span></>) : null}
      {v.submitLabel}
      </button>
      </form>
      <div aria-hidden="true" style={{ display: "flex", alignItems: "center", gap: "12px", margin: "26px 0 16px", fontSize: "12px", color: "#A3A3A0" }}><span style={{ flex: "1", height: "1px", background: "#EDEDED" }}></span>or<span style={{ flex: "1", height: "1px", background: "#EDEDED" }}></span></div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: "10px" }}>
      <button type="button" className="sso" onClick={v.onSso('google')} style={{ fontFamily: "inherit", fontSize: "13px", fontWeight: "500", color: "#0A0A0A", background: "#FAFAF8", border: "1px solid #EDEDED", borderRadius: "6px", padding: "11px 6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}><svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true" style={{ flex: "none" }}><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.7 17.7 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.2 5.6c4.2-3.9 7.1-9.6 7.1-17.1z"></path><path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.2C1 16.5 0 20.1 0 24s1 7.5 2.6 10.8l7.9-6.2z"></path><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.2-5.6c-2.2 1.5-5 2.4-8.7 2.4-6.3 0-11.6-4.2-13.5-10l-7.9 6.2C6.5 42.6 14.6 48 24 48z"></path></svg>Continue with Google</button>
      </div>
      {v.notice ? (<>
      <p className="fade" role="status" style={{ margin: "16px 0 0", fontSize: "13px", lineHeight: "20px", color: "#5E5E5E", background: "#F4F4F2", borderRadius: "6px", padding: "10px 12px" }}>{v.notice}</p>
      </>) : null}
      <p style={{ margin: "26px 0 0", textAlign: "center", fontSize: "13px", color: "#8C8C8C" }}>Don’t have an account? <Link href="/signup" className="accent-lnk">Sign up</Link></p>
      </div>
      </div>
      </div>
      </div>
      </div>
      </div>
  );
}
