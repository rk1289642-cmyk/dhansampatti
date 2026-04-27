'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  role: 'admin' | 'channel_partner';
  userName: string;
}

export default function Header({ role, userName }: HeaderProps) {
  const router = useRouter();
  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [loggingOut,    setLoggingOut]    = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const confirmRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    if (!logoutConfirm) return;
    function h(e: MouseEvent) {
      if (confirmRef.current && !confirmRef.current.contains(e.target as Node))
        setLogoutConfirm(false);
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [logoutConfirm]);

  useEffect(() => {
    if (!logoutConfirm) return;
    function h(e: KeyboardEvent) { if (e.key === 'Escape') setLogoutConfirm(false); }
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [logoutConfirm]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  async function confirmLogout() {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const initials = userName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const dashHref    = role === 'admin' ? '/dashboard/admin' : '/dashboard/cp';
  const profileHref = role === 'admin' ? '/dashboard/admin/profile' : '/dashboard/cp/profile';

  return (
    <>
      <header className="header">
        <Link href={dashHref} className="header-logo">
          <div className="header-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div className="header-logo-name">Dhansampatti Finance</div>
            <div className="header-logo-sub">Loan Management Portal</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="header-nav desktop-nav">
          {role === 'admin' && (
            <>
              <Link href="/dashboard/admin/channel-partners" className="btn btn-ghost btn-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Channel Partners
              </Link>
              <Link href="/dashboard/admin/leads" className="btn btn-ghost btn-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                All Leads
              </Link>
            </>
          )}
          {role === 'channel_partner' && (
            <Link href="/dashboard/cp/leads" className="btn btn-ghost btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              All Leads
            </Link>
          )}
          <div className="profile-wrapper" ref={dropdownRef}>
            <button className="profile-avatar" onClick={() => setDropdownOpen(p => !p)} aria-label="Profile menu" aria-expanded={dropdownOpen}>{initials}</button>
            {dropdownOpen && (
              <div className="dropdown-menu" role="menu">
                <div className="dropdown-header">
                  <strong>{userName}</strong>
                  <p>{role === 'admin' ? 'Administrator' : 'Channel Partner'}</p>
                </div>
                <Link href={profileHref} className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Profile
                </Link>
                <button className="dropdown-item danger" onClick={() => { setDropdownOpen(false); setLogoutConfirm(true); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Mobile hamburger */}
        <button className="hamburger-btn" onClick={() => setDrawerOpen(true)} aria-label="Open navigation menu">
          <span /><span /><span />
        </button>
      </header>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <nav className="drawer-panel" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-user-info">
                <div className="drawer-avatar">{initials}</div>
                <div>
                  <div className="drawer-user-name">{userName}</div>
                  <div className="drawer-user-role">{role === 'admin' ? 'Administrator' : 'Channel Partner'}</div>
                </div>
              </div>
              <button className="drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="drawer-links">
              <Link href={dashHref} className="drawer-link" onClick={() => setDrawerOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                Dashboard
              </Link>
              {role === 'admin' && (
                <>
                  <Link href="/dashboard/admin/leads" className="drawer-link" onClick={() => setDrawerOpen(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    All Leads
                  </Link>
                  <Link href="/dashboard/admin/channel-partners" className="drawer-link" onClick={() => setDrawerOpen(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    Channel Partners
                  </Link>
                </>
              )}
              {role === 'channel_partner' && (
                <Link href="/dashboard/cp/leads" className="drawer-link" onClick={() => setDrawerOpen(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  My Leads
                </Link>
              )}
              <Link href={profileHref} className="drawer-link" onClick={() => setDrawerOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                My Profile
              </Link>
            </div>
            <div className="drawer-footer">
              <button className="drawer-logout-btn" onClick={() => { setDrawerOpen(false); setLogoutConfirm(true); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Logout
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Logout Confirmation */}
      {logoutConfirm && (
        <div className="logout-overlay" role="dialog" aria-modal="true" aria-labelledby="logout-title">
          <div className="logout-popup" ref={confirmRef}>
            <div className="logout-popup-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            <h3 id="logout-title" className="logout-popup-title">Confirm Logout</h3>
            <p className="logout-popup-sub">Are you sure you want to log out of your account?</p>
            <div className="logout-popup-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => setLogoutConfirm(false)} disabled={loggingOut}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={confirmLogout} disabled={loggingOut}>
                {loggingOut ? <span className="spinner" /> : 'Yes, Logout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
