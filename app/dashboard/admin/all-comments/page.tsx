import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import ToastContainer from '@/components/ToastContainer';
import BackButton from '@/components/BackButton';
import type { Metadata } from 'next';
import CommentsFilter from './CommentsFilter';

export const metadata: Metadata = { title: 'All Comments — Dhansampatti Finance' };

export default async function AllCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/login');

  const resolvedParams = await searchParams;
  const statusId = resolvedParams?.status_id;

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
        
        <CommentsFilter />

        <div className="card" style={{ padding: '24px' }}>
          <p>Comments management functionality coming soon.</p>
          {statusId && (
            <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--gray-500)' }}>
              Filtered by status ID: {statusId}
            </p>
          )}
        </div>
      </main>
      <ToastContainer />
    </>
  );
}
