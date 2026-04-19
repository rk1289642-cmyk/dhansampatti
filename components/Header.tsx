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
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const initials = userName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  return (
    <header className="header">
      {/* Logo */}
      <Link href={role === 'admin' ? '/dashboard/admin' : '/dashboard/cp'} className="header-logo">
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

      {/* Nav */}
      <nav className="header-nav">
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

        {/* Profile Dropdown */}
        <div className="profile-wrapper" ref={ref}>
          <button
            className="profile-avatar"
            onClick={() => setOpen(p => !p)}
            aria-label="Profile menu"
            aria-expanded={open}
          >
            {initials}
          </button>

          {open && (
            <div className="dropdown-menu" role="menu">
              <div className="dropdown-header">
                <strong>{userName}</strong>
                <p>{role === 'admin' ? 'Administrator' : 'Channel Partner'}</p>
              </div>
              <Link href={role === 'admin' ? '/dashboard/admin/profile' : '/dashboard/cp/profile'} className="dropdown-item" onClick={() => setOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Profile
              </Link>
              <button className="dropdown-item danger" onClick={logout}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
