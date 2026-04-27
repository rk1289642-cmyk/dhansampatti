import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import ChannelPartnersManager from '@/components/ChannelPartnersManager';
import ToastContainer from '@/components/ToastContainer';
import BackButton from '@/components/BackButton';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Channel Partners — Dhansampatti Finance' };

export default async function ChannelPartnersPage() {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/login');

  return (
    <>
      <Header role="admin" userName={session.name} />
      <main className="page-container">
        <div className="page-heading">
          <BackButton href="/dashboard/admin" />
          <div>
            <h1 className="section-title">Channel Partners</h1>
            <p className="page-sub">Manage partner accounts, credentials and performance.</p>
          </div>
        </div>
        <div className="card" style={{ overflow: 'hidden' }}>
          <ChannelPartnersManager />
        </div>
      </main>
      <ToastContainer />
    </>
  );
}
