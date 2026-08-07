import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import LeadsManager from '@/components/LeadsManager';
import ToastContainer from '@/components/ToastContainer';
import BackButton from '@/components/BackButton';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My Leads — Dhansampatti Finance' };

export default async function AdminMyLeadsPage() {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/login');

  return (
    <>
      <Header role="admin" userName={session.name} />
      <main className="page-container">
        <div className="page-heading">
          <BackButton href="/dashboard/admin" />
          <div>
            <h1 className="section-title">My Leads</h1>
            <p className="page-sub">Search, filter and manage your leads.</p>
          </div>
        </div>
        <div className="card" style={{ overflow: 'hidden' }}>
          <LeadsManager isAdmin={true} />
        </div>
      </main>
      <ToastContainer />
    </>
  );
}
