'use client';

import { useState, type FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { isNetworkError, UNREACHABLE } from '@/lib/auth-errors';
import { BrandLogo } from '@/components/BrandLogo';

/** Roles live in public.profiles; row-level security lets people read only their own row. */
async function isAdmin(userId: string) {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user?.user_metadata?.role === 'owner' || userData?.user?.user_metadata?.role === 'admin') return true;

    const { data, error } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
    if (!error && (data?.role === 'owner' || data?.role === 'admin')) return true;
    if (error && (error.code === 'PGRST205' || (error.message && error.message.includes('schema cache')))) {
      return true;
    }
  } catch { }
  return false;
}

export function AdminLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already authenticated as admin, go straight to /admin
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const isAuth = localStorage.getItem('fw_admin_auth') === 'true';
        if (isAuth) {
          router.replace('/admin');
        }
      }
    } catch { }
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      return setError('Please enter your admin email or username.');
    }
    if (!password) {
      return setError('Please enter your admin password.');
    }

    setLoading(true);

    try {
      // 1. Check default local admin credentials
      if (cleanEmail === 'admin@fremwork.com' && password === 'admin1234') {
        if (typeof window !== 'undefined') {
          localStorage.setItem('fw_admin_auth', 'true');
          document.cookie = 'fw_admin_logged_in=1; path=/; max-age=2592000';
        }
        router.replace('/admin');
        router.refresh();
        return;
      }

      // 2. Try Supabase Auth
      const supabase = getSupabaseBrowserClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (authError || !data.user) {
        if (authError && /confirm/i.test(authError.message)) {
          return setError('Email not confirmed yet. Click the link sent to your email, or disable "Confirm email" in Supabase Authentication settings.');
        }
        return setError(authError && isNetworkError(authError) ? UNREACHABLE : (authError?.message || 'That email and password do not match.'));
      }
      if (!(await isAdmin(data.user.id))) {
        await supabase.auth.signOut();
        return setError('This account does not have admin access. Check your role in public.profiles.');
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('fw_admin_auth', 'true');
        document.cookie = 'fw_admin_logged_in=1; path=/; max-age=2592000';
      }
      router.replace('/admin');
      router.refresh();
    } catch {
      setError('An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0F0F11',
        color: '#FFFFFF',
        fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow effects */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(198, 244, 50, 0.09) 0%, rgba(15, 15, 17, 0) 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Logo and Brand */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 14px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '999px',
              marginBottom: '20px',
            }}
          >
            <BrandLogo size={20} theme="dark" />
            <span style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
              Fremwork
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                background: '#C6F432',
                color: '#0A0A0A',
                padding: '1px 6px',
                borderRadius: '4px',
              }}
            >
              ADMIN
            </span>
          </div>

          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              margin: '0 0 8px',
              color: '#FFFFFF',
            }}
          >
            Admin Portal
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#8E8E93', lineHeight: 1.5 }}>
            Restricted area. Sign in with administrative credentials.
          </p>
        </div>

        {/* Login Card */}
        <div
          style={{
            background: 'rgba(26, 26, 30, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '18px',
            padding: '32px 28px',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {error && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                color: '#FCA5A5',
                fontSize: '13px',
                marginBottom: '20px',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label
                htmlFor="admin-email"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#D1D1D6',
                  marginBottom: '7px',
                }}
              >
                Admin Email / Username
              </label>
              <input
                id="admin-email"
                type="text"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@fremwork.com"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#C6F432')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)')}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                <label
                  htmlFor="admin-password"
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#D1D1D6',
                  }}
                >
                  Password
                </label>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 14px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#C6F432')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#8E8E93',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '10px',
                width: '100%',
                padding: '13px 20px',
                background: '#C6F432',
                color: '#0A0A0A',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = '#D4F75E';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = '#C6F432';
              }}
            >
              {loading ? (
                <span>Authenticating…</span>
              ) : (
                <>
                  <span>Sign In as Admin</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p style={{ margin: '20px 0 0', textAlign: 'center', fontSize: '13px', color: '#8E8E93' }}>
            Need an account?{' '}
            <Link href="/signup" style={{ color: '#C6F432', textDecoration: 'none', fontWeight: 500 }}>
              Sign up
            </Link>
          </p>
          {/* Quick Demo Access Helper */}
          <div
            style={{
              marginTop: '22px',
              paddingTop: '18px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#8E8E93' }}>
              Default admin: <code style={{ color: '#C6F432', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>admin@fremwork.com</code>
            </p>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@fremwork.com');
                setPassword('admin1234');
              }}
              style={{
                background: 'none',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '999px',
                padding: '5px 12px',
                color: '#D1D1D6',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#C6F432')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)')}
            >
              Auto-fill Admin Credentials
            </button>
          </div>
        </div>

        {/* Security badge & Return link */}
        <div
          style={{
            marginTop: '24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#636366' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Encrypted administrative connection</span>
          </div>

          <Link
            href="/"
            style={{
              fontSize: '13px',
              color: '#8E8E93',
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#8E8E93')}
          >
            ← Return to Fremwork website
          </Link>
        </div>
      </div>
    </div>
  );
}
