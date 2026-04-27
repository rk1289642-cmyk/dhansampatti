import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import sql from '@/lib/db';
import Header from '@/components/Header';
import BackButton from '@/components/BackButton';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My Profile — Dhansampatti Finance' };

export default async function AdminProfile() {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/login');

  const rows = await sql`
    SELECT id, name, email, address, gender, pan_card, created_at
    FROM users WHERE id = ${session.userId} LIMIT 1
  `;
  const user = rows[0];

  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase();

  return (
    <>
      <Header role="admin" userName={session.name} />
      <main className="page-container">
        <div className="page-heading">
          <BackButton href="/dashboard/admin" />
          <div>
            <h1 className="section-title">My Profile</h1>
            <p className="page-sub">View your account details and information.</p>
          </div>
        </div>

        <div className="profile-layout">
          {/* ── Avatar Card ── */}
          <div className="card profile-avatar-card">
            <div className="profile-initials-circle">{initials}</div>
            <div className="profile-name">{user.name}</div>
            <span className="badge badge-blue profile-role-badge">Administrator</span>
            <div className="profile-meta-row">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Member since {new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </div>
          </div>

          {/* ── Details Card ── */}
          <div className="card profile-details-card">
            <div className="profile-section-title">Account Information</div>

            <ProfileRow
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
              label="Full Name"
              value={user.name}
            />
            <ProfileRow
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
              label="Email"
              value={user.email}
            />
            <ProfileRow
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
              label="Gender"
              value={user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : '—'}
            />
            <ProfileRow
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>}
              label="Address"
              value={user.address ?? '—'}
            />
            <ProfileRow
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
              label="PAN Card"
              value={user.pan_card ?? '—'}
              mono
            />
            <ProfileRow
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
              label="Role"
              value="Administrator"
              last
            />
          </div>
        </div>
      </main>
    </>
  );
}

function ProfileRow({
  icon, label, value, mono, last,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  last?: boolean;
}) {
  return (
    <div className={`profile-row${last ? ' profile-row-last' : ''}`}>
      <div className="profile-row-label">
        <span className="profile-row-icon">{icon}</span>
        {label}
      </div>
      <div className={`profile-row-value${mono ? ' mono' : ''}`}>{value}</div>
    </div>
  );
}
