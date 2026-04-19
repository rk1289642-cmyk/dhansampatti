import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import sql from '@/lib/db';
import Header from '@/components/Header';
import InsightCards from '@/components/InsightCards';
import AddChannelPartnerForm from '@/components/AddChannelPartnerForm';
import AddLeadForm from '@/components/AddLeadForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Admin Dashboard — Dhansampatti Finance' };

async function getStats() {
  const [leads, cps, sanctioned, disbursed] = await Promise.all([
    sql`SELECT COUNT(*) AS count FROM leads`,
    sql`SELECT COUNT(*) AS count FROM users u JOIN roles r ON r.id = u.role_id WHERE r.role_name = 'channel_partner'`,
    sql`SELECT COUNT(*) AS count FROM leads l JOIN lead_statuses ls ON ls.id = l.status_id WHERE ls.lead_status = 'Sanction'`,
    sql`SELECT COUNT(*) AS count FROM leads l JOIN lead_statuses ls ON ls.id = l.status_id WHERE ls.lead_status = 'Disbursal'`,
  ]);
  return {
    totalLeads:      Number(leads[0].count),
    totalCPs:        Number(cps[0].count),
    totalSanctioned: Number(sanctioned[0].count),
    totalDisbursed:  Number(disbursed[0].count),
  };
}

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/login');

  const stats = await getStats();

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
      label: 'Total Channel Partners',
      value: stats.totalCPs,
      colorClass: 'ic-purple',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
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
      <Header role="admin" userName={session.name} />
      <main className="page-container">
        <InsightCards cards={cards} />

        <div className="forms-grid">
          {/* Add Channel Partner */}
          <div className="card form-card">
            <div className="form-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              Add Channel Partner
            </div>
            <AddChannelPartnerForm />
          </div>

          {/* Add Lead */}
          <div className="card form-card">
            <div className="form-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              Add Lead
            </div>
            <AddLeadForm />
          </div>
        </div>
      </main>
    </>
  );
}
