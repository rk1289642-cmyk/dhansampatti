import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import ToastContainer from '@/components/ToastContainer';
import BackButton from '@/components/BackButton';
import type { Metadata } from 'next';
import sql from '@/lib/db';
import Link from 'next/link';

export const metadata: Metadata = { title: 'My Comments — Dhansampatti Finance' };

export default async function MyCommentsPage() {
  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'platform_admin')) redirect('/login');

  const comments = await sql`
    SELECT c.*,
           u.name AS user_name,
           l.full_name AS lead_name,
           ns.lead_status AS new_status_name
    FROM lead_comments c
    JOIN users u ON u.id = c.user_id
    JOIN leads l ON l.id = c.lead_id
    LEFT JOIN lead_statuses ns ON ns.id = c.new_status_id
    WHERE c.user_id = ${session.userId}
    ORDER BY c.created_at DESC
    LIMIT 100
  `;

  return (
    <>
      <Header role={session.role as 'admin' | 'platform_admin'} userName={session.name} />
      <main className="page-container">
        <div className="page-heading">
          <BackButton href="/dashboard/admin" />
          <div>
            <h1 className="section-title">My Comments</h1>
            <p className="page-sub">View and manage your comments.</p>
          </div>
        </div>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {comments.map(c => (
              <div key={c.id} style={{ display: 'flex', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--gray-100)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-600)', fontWeight: 600, flexShrink: 0 }}>
                  {c.user_name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>
                      {c.user_name} <span style={{ fontWeight: 400, color: 'var(--gray-500)' }}>on</span> <Link href={`/dashboard/admin/leads/${c.lead_id}`} className="text-primary hover-underline">{c.lead_name}</Link>
                    </div>
                    <div style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>
                      {new Date(c.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {c.comment_text && (
                    <div style={{ color: 'var(--gray-700)', fontSize: '0.95rem', marginBottom: '8px', whiteSpace: 'pre-wrap' }}>
                      {c.comment_text}
                    </div>
                  )}
                  {c.new_status_name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', marginTop: c.comment_text ? '8px' : '0' }}>
                       <span style={{ color: 'var(--gray-500)' }}>Status updated to</span>
                       <span style={{ color: 'var(--primary)', backgroundColor: 'var(--primary-50)', padding: '2px 8px', borderRadius: '12px', fontWeight: 500, fontSize: '0.8rem' }}>{c.new_status_name}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '2rem 0' }}>
                You haven't posted any comments yet.
              </div>
            )}
          </div>
        </div>
      </main>
      <ToastContainer />
    </>
  );
}
