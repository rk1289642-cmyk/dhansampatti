import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import sql from '@/lib/db';
import Header from '@/components/Header';
import InsightCards from '@/components/InsightCards';
import AddLeadForm from '@/components/AddLeadForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard — Dhansampatti Finance' };

async function getCPStats(cpId: string) {
  const [total, created, sanctioned, disbursed] = await Promise.all([
    sql`SELECT COUNT(*) AS count FROM leads WHERE cp_id = ${cpId}`,
    sql`SELECT COUNT(*) AS count FROM leads l JOIN lead_statuses ls ON ls.id = l.status_id WHERE l.cp_id = ${cpId} AND ls.lead_status = 'Lead Created'`,
    sql`SELECT COUNT(*) AS count FROM leads l JOIN lead_statuses ls ON ls.id = l.status_id WHERE l.cp_id = ${cpId} AND ls.lead_status = 'Sanction'`,
    sql`SELECT COUNT(*) AS count FROM leads l JOIN lead_statuses ls ON ls.id = l.status_id WHERE l.cp_id = ${cpId} AND ls.lead_status = 'Disbursal'`,
  ]);
  return {
    totalLeads:      Number(total[0].count),
    totalCreated:    Number(created[0].count),
    totalSanctioned: Number(sanctioned[0].count),
    totalDisbursed:  Number(disbursed[0].count),
  };
}

export default async function CPDashboard() {
  const session = await getSession();
  if (!session || session.role !== 'channel_partner') redirect('/login');

  const stats = await getCPStats(session.userId);

  const cards = [
    {
      label: 'Total Leads',
      value: stats.totalLeads,
      colorClass: 'ic-blue',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        </svg>
      ),
    },
    {
      label: 'Leads Created',
      value: stats.totalCreated,
      colorClass: 'ic-purple',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
      ),
    },
    {
      label: 'Leads Sanctioned',
      value: stats.totalSanctioned,
      colorClass: 'ic-green',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ),
    },
    {
      label: 'Leads Disbursed',
      value: stats.totalDisbursed,
      colorClass: 'ic-amber',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
    },
  ];

  return (
    <>
      <Header role="channel_partner" userName={session.name} />
      <main className="page-container">
        <InsightCards cards={cards} />

        <div className="card form-card" style={{ maxWidth: 720 }}>
          <div className="form-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
            Add New Lead
          </div>
          <AddLeadForm />
        </div>
      </main>
    </>
  );
}
