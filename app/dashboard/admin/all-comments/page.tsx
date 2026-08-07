import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import ToastContainer from '@/components/ToastContainer';
import BackButton from '@/components/BackButton';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'All Comments — Dhansampatti Finance' };

export default async function AllCommentsPage() {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/login');

  return (
    <>
      <Header role="admin" userName={session.name} />
      <main className="page-container">
        <div className="page-heading">
          <BackButton href="/dashboard/admin" />
          <div>
            <h1 className="section-title">All Comments</h1>
            <p className="page-sub">View and manage all comments.</p>
          </div>
        </div>
        <div className="card" style={{ padding: '24px' }}>
          <p>Comments management functionality coming soon.</p>
        </div>
      </main>
      <ToastContainer />
    </>
  );
}
