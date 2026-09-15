import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import ChannelPartnersManager from '@/components/ChannelPartnersManager';
import ToastContainer from '@/components/ToastContainer';
import BackButton from '@/components/BackButton';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Users — Dhansampatti Finance' };

export default async function UsersPage() {
  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'platform_admin')) redirect('/login');

  return (
    <>
      <Header role={session.role} userName={session.name} />
      <main className="page-container">
        <div className="page-heading">
          <BackButton href="/dashboard/admin" />
          <div>
            <h1 className="section-title">Users</h1>
            <p className="page-sub">Manage platform admins and channel partners.</p>
          </div>
        </div>
        <div className="card" style={{ overflow: 'hidden' }}>
          <ChannelPartnersManager userRole={session.role} />
        </div>
      </main>
      <ToastContainer />
    </>
  );
}
