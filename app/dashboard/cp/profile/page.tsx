import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import sql from '@/lib/db';
import Header from '@/components/Header';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My Profile — Dhansampatti Finance' };

export default async function CPProfile() {
  const session = await getSession();
  if (!session || session.role !== 'channel_partner') redirect('/login');

  const rows = await sql`SELECT id, name, email, address, gender, cp_email, pan_card, created_at FROM users WHERE id = ${session.userId} LIMIT 1`;
  const user = rows[0];

  return (
    <>
      <Header role="channel_partner" userName={session.name} />
      <main className="page-container">
        <h1 className="section-title" style={{ marginBottom: 20 }}>My Profile</h1>
        <div className="card form-card" style={{ maxWidth: 520 }}>
          <ProfileDetail label="Full Name"    value={user.name} />
          <ProfileDetail label="Email"        value={user.email} />
          <ProfileDetail label="Office Email" value={user.cp_email ?? '—'} />
          <ProfileDetail label="Gender"       value={user.gender ?? '—'} capitalize />
          <ProfileDetail label="Address"      value={user.address ?? '—'} />
          <ProfileDetail label="PAN Card"     value={user.pan_card ?? '—'} />
          <ProfileDetail label="Role"         value="Channel Partner" />
          <ProfileDetail label="Member Since" value={new Date(user.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} />
        </div>
      </main>
    </>
  );
}

function ProfileDetail({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--gray-100)' }}>
      <span style={{ fontSize: '.8125rem', color: 'var(--gray-500)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '.875rem', color: 'var(--gray-800)', textTransform: capitalize ? 'capitalize' : 'none' }}>{value}</span>
    </div>
  );
}
