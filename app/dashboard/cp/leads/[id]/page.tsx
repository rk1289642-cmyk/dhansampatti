import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import LeadDetails from '@/components/LeadDetails';
import ToastContainer from '@/components/ToastContainer';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Lead Details — Dhansampatti Finance' };

export default async function CPLeadDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'channel_partner') redirect('/login');

  const { id } = await params;

  return (
    <>
      <Header role="channel_partner" userName={session.name} />
      <main className="page-container" style={{ padding: '0 1rem' }}>
        <LeadDetails isAdmin={false} leadId={id} />
      </main>
      <ToastContainer />
    </>
  );
}
