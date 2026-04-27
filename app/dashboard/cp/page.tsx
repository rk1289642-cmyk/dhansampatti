import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import sql from '@/lib/db';
import Header from '@/components/Header';
import ToastContainer from '@/components/ToastContainer';
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
  const firstName = session.name.split(' ')[0];

  return (
    <>
      <Header role="channel_partner" userName={session.name} />
      <main className="page-container">

        {/* ── Hero Banner ── */}
        <div className="dash-hero dash-hero-cp">
          <div className="dash-hero-text">
            <p className="dash-hero-greeting">Hello, {firstName} 👋</p>
            <h1 className="dash-hero-title">My Lead Dashboard</h1>
            <p className="dash-hero-sub">Your loan management dashboard — Channel Partner View</p>
          </div>
          <div className="dash-hero-decoration" aria-hidden="true">
            <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="160" cy="20" r="60" fill="rgba(255,255,255,.07)"/>
              <circle cx="30"  cy="90" r="40" fill="rgba(255,255,255,.05)"/>
              <circle cx="100" cy="60" r="30" fill="rgba(255,255,255,.04)"/>
            </svg>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="kpi-grid">
          <div className="kpi-card kpi-blue">
            <div className="kpi-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div className="kpi-value">{stats.totalLeads}</div>
            <div className="kpi-label">Total Leads</div>
          </div>

          <div className="kpi-card kpi-purple">
            <div className="kpi-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </div>
            <div className="kpi-value">{stats.totalCreated}</div>
            <div className="kpi-label">Leads Created</div>
          </div>

          <div className="kpi-card kpi-green">
            <div className="kpi-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div className="kpi-value">{stats.totalSanctioned}</div>
            <div className="kpi-label">Sanctioned</div>
          </div>

          <div className="kpi-card kpi-amber">
            <div className="kpi-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div className="kpi-value">{stats.totalDisbursed}</div>
            <div className="kpi-label">Disbursed</div>
          </div>
        </div>

        {/* ── Quick Links ── */}
        <h2 className="dash-section-label">Quick Actions</h2>
        <div className="quick-links">
          <a href="/dashboard/cp/leads" className="quick-link-card">
            <div className="ql-icon ic-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div>
              <div className="ql-title">My Leads</div>
              <div className="ql-sub">View, add and manage your submitted loan leads</div>
            </div>
            <svg className="ql-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </a>
        </div>
      </main>
      <ToastContainer />
    </>
  );
}
