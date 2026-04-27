'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

/* ── Icon helpers ─────────────────────────────────────── */
function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  );
}
function IconLock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}
function IconEye({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>
    </svg>
  );
}
function IconShield() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

/* ── Decorative SVG shapes for left panel ─────────────── */
function BrandingDecor() {
  return (
    <svg className="login-panel-decor" viewBox="0 0 600 700" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="500" cy="80" r="220" fill="rgba(255,255,255,0.04)"/>
      <circle cx="500" cy="80" r="160" fill="rgba(255,255,255,0.04)"/>
      <circle cx="80" cy="600" r="200" fill="rgba(255,255,255,0.04)"/>
      <circle cx="80" cy="600" r="130" fill="rgba(255,255,255,0.04)"/>
      <rect x="60" y="240" width="90" height="90" rx="20" fill="rgba(255,255,255,0.06)" transform="rotate(15 60 240)"/>
      <rect x="380" y="440" width="70" height="70" rx="16" fill="rgba(255,255,255,0.05)" transform="rotate(-10 380 440)"/>
      <path d="M120 180 L180 120 L240 180 L180 240 Z" fill="rgba(255,255,255,0.05)"/>
      <circle cx="300" cy="350" r="8" fill="rgba(255,255,255,0.12)"/>
      <circle cx="420" cy="280" r="5" fill="rgba(255,255,255,0.10)"/>
      <circle cx="160" cy="460" r="6" fill="rgba(255,255,255,0.10)"/>
    </svg>
  );
}

/* ── Fintech feature chips ────────────────────────────── */
function FeatureChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="login-feature-chip">
      <span className="login-feature-chip-icon">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Login failed. Please try again.');
      return;
    }

    router.push(data.role === 'admin' ? '/dashboard/admin' : '/dashboard/cp');
    router.refresh();
  }

  return (
    <div className="lp-root">

      {/* ── LEFT: Branding Panel ──────────────────────────── */}
      <div className="lp-panel" aria-hidden="true">
        <BrandingDecor />

        {/* Logo */}
        <div className="lp-logo">
          <div className="lp-logo-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="lp-logo-name">Dhansampatti</span>
        </div>

        {/* Main copy */}
        <div className="lp-copy">
          <h2 className="lp-headline">Dhansampatti<br />Finance</h2>
          <p className="lp-tagline">Smart, secure, and seamless loan management for modern financial operations.</p>
          <p className="lp-support">Streamline approvals, track repayments, and manage clients with confidence.</p>
        </div>

        {/* Feature chips */}
        <div className="lp-features">
          <FeatureChip
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
            label="Instant Loan Approvals"
          />
          <FeatureChip
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
            label="Real-time Repayment Tracking"
          />
          <FeatureChip
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
            label="Secure Role-based Access"
          />
          <FeatureChip
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
            label="Channel Partner Management"
          />
        </div>

        {/* Bottom tagline */}
        <p className="lp-footer-note">© 2026 Dhansampatti Finance. All rights reserved.</p>
      </div>

      {/* ── RIGHT: Login Form ─────────────────────────────── */}
      <div className="lp-form-side">
        <div className="lp-form-card">

          {/* Mobile-only logo */}
          <div className="lp-mobile-logo">
            <div className="lp-logo-icon" style={{ width: 40, height: 40 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="lp-logo-name" style={{ color: 'var(--gray-900)' }}>Dhansampatti Finance</span>
          </div>

          {/* Form header */}
          <div className="lp-form-header">
            <h1 className="lp-form-title">Welcome Back</h1>
            <p className="lp-form-sub">Sign in to your account to continue</p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="lp-error" role="alert">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="lp-form">

            {/* Email */}
            <div className="lp-field">
              <label htmlFor="lp-email" className="lp-label">Email Address</label>
              <div className="lp-input-wrap">
                <span className="lp-input-icon"><IconMail /></span>
                <input
                  id="lp-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="lp-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="lp-field">
              <div className="lp-label-row">
                <label htmlFor="lp-password" className="lp-label">Password</label>
                <a href="#" className="lp-forgot" tabIndex={0}>Forgot Password?</a>
              </div>
              <div className="lp-input-wrap">
                <span className="lp-input-icon"><IconLock /></span>
                <input
                  id="lp-password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="lp-input lp-input-pw"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="lp-pw-toggle"
                  onClick={() => setShowPw(v => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                >
                  <IconEye open={showPw} />
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="lp-signin-btn"
              type="submit"
              className="lp-btn-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="lp-spinner" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Trust note */}
          <div className="lp-trust">
            <IconShield />
            <span>Secure login&nbsp;•&nbsp;Authorized personnel only</span>
          </div>
        </div>
      </div>
    </div>
  );
}
