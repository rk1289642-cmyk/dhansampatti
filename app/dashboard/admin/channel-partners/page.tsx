import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import sql from '@/lib/db';
import Header from '@/components/Header';
import type { Metadata } from 'next';

interface PartnerRow {
  id: string;
  name: string;
  email: string;
  gender: string | null;
  cp_email: string | null;
  pan_card: string | null;
  lead_count: string;
  created_at: string;
}

export const metadata: Metadata = { title: 'Channel Partners — Dhansampatti Finance' };

export default async function ChannelPartnersPage() {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/login');

  const partners = await sql`
    SELECT u.id, u.name, u.email, u.address, u.gender, u.cp_email, u.pan_card, u.created_at,
           COUNT(l.id) AS lead_count
    FROM users u
    JOIN roles r ON r.id = u.role_id
    LEFT JOIN leads l ON l.cp_id = u.id
    WHERE r.role_name = 'channel_partner'
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `;

  return (
    <>
      <Header role="admin" userName={session.name} />
      <main className="page-container">
        <div className="section-header">
          <h1 className="section-title">Channel Partners</h1>
          <span style={{ fontSize: '.8125rem', color: 'var(--gray-400)' }}>{partners.length} total</span>
        </div>

        <div className="card" style={{ padding: '4px 0' }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Gender</th>
                  <th>Office Email</th>
                  <th>PAN Card</th>
                  <th>Leads</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {(partners as PartnerRow[]).map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500, color: 'var(--gray-900)' }}>{p.name}</td>
                    <td>{p.email}</td>
                    <td style={{ textTransform: 'capitalize' }}>{p.gender ?? '—'}</td>
                    <td style={{ color: 'var(--gray-500)' }}>{p.cp_email ?? '—'}</td>
                    <td><span className="badge badge-gray">{p.pan_card ?? '—'}</span></td>
                    <td><span className="badge badge-blue">{p.lead_count}</span></td>
                    <td style={{ color: 'var(--gray-400)', fontSize: '.8rem' }}>
                      {new Date(p.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
                {!partners.length && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--gray-400)' }}>No channel partners yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
