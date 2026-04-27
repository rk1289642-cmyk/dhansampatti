import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import LeadsManager from '@/components/LeadsManager';
import ToastContainer from '@/components/ToastContainer';
import BackButton from '@/components/BackButton';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My Leads — Dhansampatti Finance' };

export default async function CPLeadsPage() {
  const session = await getSession();
  if (!session || session.role !== 'channel_partner') redirect('/login');

  return (
    <>
      <Header role="channel_partner" userName={session.name} />
      <main className="page-container">
        <div className="page-heading">
          <BackButton href="/dashboard/cp" />
          <div>
            <h1 className="section-title">My Leads</h1>
            <p className="page-sub">Manage leads you have submitted. Only your own leads are shown.</p>
          </div>
        </div>
        <div className="card" style={{ overflow: 'hidden' }}>
          <LeadsManager isAdmin={false} />
        </div>
      </main>
      <ToastContainer />
    </>
  );
}
