'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FramSvg, type FramFace } from '@/components/fram/FramSvg';
import { UserDashboard } from '@/components/screens/UserDashboard';
import '@/styles/login.css';
import { useState, type CSSProperties, type FormEvent } from 'react';
import { useFram } from '@/components/fram/useFram';

const labelStyle: CSSProperties = { fontSize: '13px', fontWeight: 500 };
const fieldWrap: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '7px' };
const brandStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontWeight: 600,
  fontSize: '19px',
  letterSpacing: '-0.03em',
  textDecoration: 'none',
  color: '#0A0A0A',
};
const brandMark = (
  <span
    aria-hidden="true"
    style={{ width: '14px', height: '14px', background: '#C6F432', boxShadow: 'inset 0 0 0 2px #0A0A0A' }}
  ></span>
);
const asterisk = (
  <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
    <g stroke="#C6F432" strokeWidth="4.5" strokeLinecap="round">
      <path d="M15 3 V27"></path>
      <path d="M4.6 9 L25.4 21"></path>
      <path d="M4.6 21 L25.4 9"></path>
    </g>
  </svg>
);

/** Create an account screen. */
export function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [peek, setPeek] = useState(false);
  const [peekConfirm, setPeekConfirm] = useState(false);
  const [signedUp, setSignedUp] = useState(false);

  const fram = useFram(signedUp ? 'grin' : '');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    try {
      if (typeof window !== 'undefined') {
        const savedUsers: Array<{ name: string; company?: string; password?: string; signedUp?: boolean; at?: string }> =
          JSON.parse(localStorage.getItem('fw_accounts') || '[]');
        const newUser = { name, company, password, signedUp: true, at: new Date().toISOString() };
        savedUsers.push(newUser);
        localStorage.setItem('fw_accounts', JSON.stringify(savedUsers));
        localStorage.setItem('fw_user', JSON.stringify(newUser));
        document.cookie = 'fw_logged_in=1; path=/; max-age=2592000';
      }
    } catch {}
    router.replace('/home');
  };

  const onGoogle = () => {
    const newUser = { name: 'Google User', email: 'user@gmail.com', signedUp: true, at: new Date().toISOString() };
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('fw_user', JSON.stringify(newUser));
        document.cookie = 'fw_logged_in=1; path=/; max-age=2592000';
      }
    } catch {}
    router.replace('/home');
  };

  const fieldBox: CSSProperties = {
    background: '#FFFFFF',
    border: '1px solid #E2E2DF',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    paddingRight: '6px',
  };

  const textInputStyle: CSSProperties = {
    flex: '1 1 auto',
    minWidth: 0,
    width: '100%',
    boxSizing: 'border-box',
    border: '0',
    outline: 'none',
    background: 'transparent',
    fontFamily: 'inherit',
    fontSize: '15px',
    color: '#0A0A0A',
    padding: '12px 14px',
  };

  if (signedUp) {
    return (
      <UserDashboard
        userName={name || 'User'}
        onLogout={() => {
          try {
            localStorage.removeItem('fw_user');
          } catch {}
          setSignedUp(false);
        }}
        defaultTab="home"
      />
    );
  }

  return (
    <div className="pg-login">
      <div
        className="auth-wrap"
        onMouseMove={fram.onMove}
        onMouseEnter={fram.onEnter}
        onMouseLeave={fram.onLeave}
        style={{
          minHeight: '100vh',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(16px, 4vw, 48px)',
          fontFamily: "'Geist', system-ui, sans-serif",
          color: '#0A0A0A',
          background: '#E9E9E6',
        }}
      >
        <div
          className="auth-card"
          style={{
            width: '100%',
            maxWidth: '1040px',
            minHeight: '620px',
            display: 'flex',
            background: '#FFFFFF',
            borderRadius: '22px',
            padding: '10px',
            boxSizing: 'border-box',
            boxShadow: '0 1px 2px rgba(10,10,10,0.04), 0 24px 60px rgba(10,10,10,0.08)',
          }}
        >
          {/* Left panel */}
          <div
            className="lside"
            style={{
              position: 'relative',
              flex: '0 0 46%',
              borderRadius: '16px',
              overflow: 'hidden',
              background: '#F1F1EC',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '28px 30px 34px',
              boxSizing: 'border-box',
            }}
          >
            <div
              aria-hidden="true"
              className="glow"
              style={{
                position: 'absolute',
                left: '-20%',
                top: '18%',
                width: '130%',
                height: '80%',
                borderRadius: '50%',
                background:
                  'radial-gradient(closest-side, rgba(198,244,50,0.85), rgba(198,244,50,0.35) 55%, rgba(198,244,50,0) 100%)',
                filter: 'blur(30px)',
              }}
            ></div>
            <Link href="/" style={{ ...brandStyle, position: 'relative', zIndex: 1, alignSelf: 'flex-start' }}>
              {brandMark}Fremwork
            </Link>
            <div style={{ position: 'relative', zIndex: 1, width: '62%', alignSelf: 'center', margin: '24px 0' }}>
              <FramSvg
                f={fram as unknown as FramFace}
                label="Fram, the Fremwork character, waving hello"
                className="fram-svg"
                svgRef={fram.setFram}
                onMouseDown={fram.onPoke}
                style={{ display: 'block', width: '100%', height: 'auto', overflow: 'visible' }}
              />
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#3A3A38' }}>With Fremwork you can</p>
              <p
                style={{
                  margin: '10px 0 0',
                  fontSize: 'clamp(22px, 2.4vw, 28px)',
                  lineHeight: 1.22,
                  letterSpacing: '-0.02em',
                  fontWeight: 500,
                }}
              >
                Ask your finance team anything, and leave with a clear next step.
              </p>
            </div>
          </div>

          {/* Form */}
          <div
            className="auth-form"
            style={{
              flex: '1 1 0',
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'clamp(28px, 5vw, 64px) clamp(20px, 5vw, 72px)',
            }}
          >
            <Link
              href="/"
              className="mob-brand"
              style={{ ...brandStyle, display: 'none', alignSelf: 'flex-start', marginBottom: '28px' }}
            >
              {brandMark}Fremwork
            </Link>
            <div style={{ width: '100%', maxWidth: '360px' }}>
              <div className="fade" style={{ display: 'flex', flexDirection: 'column' }}>
                {asterisk}
                <h1
                  style={{
                    margin: '18px 0 0',
                    fontSize: '30px',
                    lineHeight: 1.15,
                    letterSpacing: '-0.03em',
                    fontWeight: 600,
                  }}
                >
                  Create your account
                </h1>
                <p style={{ margin: '10px 0 0', fontSize: '14px', lineHeight: '22px', color: '#8C8C8C' }}>
                  Ask your numbers anything, from cash and margin to overdue invoices, in one place.
                </p>
                <form
                  onSubmit={onSubmit}
                  style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}
                >
                  {/* Name */}
                  <div style={fieldWrap}>
                    <label htmlFor="su-name" style={labelStyle}>
                      Your name
                    </label>
                    <div className="field" style={fieldBox}>
                      <input
                        id="su-name"
                        autoComplete="name"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={textInputStyle}
                      />
                    </div>
                  </div>

                  {/* Company */}
                  <div style={fieldWrap}>
                    <label htmlFor="su-company" style={labelStyle}>
                      Company <span style={{ color: '#8C8C8C', fontWeight: 400 }}>(optional)</span>
                    </label>
                    <div className="field" style={fieldBox}>
                      <input
                        id="su-company"
                        autoComplete="organization"
                        placeholder="Your company"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        style={textInputStyle}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div style={fieldWrap}>
                    <label htmlFor="su-pass" style={labelStyle}>
                      Password
                    </label>
                    <div className="field" style={fieldBox}>
                      <input
                        id="su-pass"
                        type={peek ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={textInputStyle}
                      />
                      <button
                        type="button"
                        className="peek"
                        tabIndex={-1}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPeek((v) => !v);
                        }}
                        aria-label={peek ? 'Hide password' : 'Show password'}
                        title={peek ? 'Hide password' : 'Show password'}
                        style={{
                          width: '38px',
                          height: '38px',
                          flex: 'none',
                          border: 0,
                          borderRadius: '6px',
                          background: peek ? '#F0F0ED' : 'transparent',
                          color: '#0A0A0A',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          padding: 0,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {peek ? (
                          /* Slashed eye = click to hide password */
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
                          /* Open eye = click to show password */
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
                  </div>

                  {/* Confirm password */}
                  <div style={fieldWrap}>
                    <label htmlFor="su-confirm-pass" style={labelStyle}>
                      Confirm password
                    </label>
                    <div className="field" style={fieldBox}>
                      <input
                        id="su-confirm-pass"
                        type={peekConfirm ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        style={textInputStyle}
                      />
                      <button
                        type="button"
                        className="peek"
                        tabIndex={-1}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPeekConfirm((v) => !v);
                        }}
                        aria-label={peekConfirm ? 'Hide password' : 'Show password'}
                        title={peekConfirm ? 'Hide password' : 'Show password'}
                        style={{
                          width: '38px',
                          height: '38px',
                          flex: 'none',
                          border: 0,
                          borderRadius: '6px',
                          background: peekConfirm ? '#F0F0ED' : 'transparent',
                          color: '#0A0A0A',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          padding: 0,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {peekConfirm ? (
                          /* Slashed eye = click to hide password */
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
                          /* Open eye = click to show password */
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
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn-dark"
                    style={{
                      marginTop: '8px',
                      width: '100%',
                      minHeight: '46px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      fontFamily: 'inherit',
                      fontSize: '15px',
                      fontWeight: 500,
                      color: '#FFFFFF',
                      background: '#0A0A0A',
                      border: 0,
                      borderRadius: '6px',
                      padding: '12px 20px',
                      cursor: 'pointer',
                      transition: 'background .2s',
                      boxShadow: '0 10px 24px rgba(10,10,10,0.22), inset 0 1px 0 rgba(255,255,255,0.12)',
                    }}
                  >
                    Create account
                  </button>
                </form>

                <div
                  aria-hidden="true"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    margin: '22px 0 14px',
                    fontSize: '12px',
                    color: '#A3A3A0',
                  }}
                >
                  <span style={{ flex: 1, height: '1px', background: '#EDEDED' }}></span>or
                  <span style={{ flex: 1, height: '1px', background: '#EDEDED' }}></span>
                </div>
                <button
                  type="button"
                  className="sso"
                  onClick={onGoogle}
                  style={{
                    fontFamily: 'inherit',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#0A0A0A',
                    background: '#FAFAF8',
                    border: '1px solid #EDEDED',
                    borderRadius: '6px',
                    padding: '11px 6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true" style={{ flex: 'none' }}>
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.7 17.7 9.5 24 9.5z"
                    ></path>
                    <path
                      fill="#4285F4"
                      d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.2 5.6c4.2-3.9 7.1-9.6 7.1-17.1z"
                    ></path>
                    <path
                      fill="#FBBC05"
                      d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.2C1 16.5 0 20.1 0 24s1 7.5 2.6 10.8l7.9-6.2z"
                    ></path>
                    <path
                      fill="#34A853"
                      d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.2-5.6c-2.2 1.5-5 2.4-8.7 2.4-6.3 0-11.6-4.2-13.5-10l-7.9 6.2C6.5 42.6 14.6 48 24 48z"
                    ></path>
                  </svg>
                  Continue with Google
                </button>
                <p style={{ margin: '22px 0 0', textAlign: 'center', fontSize: '13px', color: '#8C8C8C' }}>
                  Already have an account?{' '}
                  <Link href="/login" className="accent-lnk">
                    Log in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
