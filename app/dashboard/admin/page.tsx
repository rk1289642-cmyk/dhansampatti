import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import sql from '@/lib/db';
import Header from '@/components/Header';
import ToastContainer from '@/components/ToastContainer';
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
  const firstName = session.name.split(' ')[0];

  return (
    <>
      <Header role="admin" userName={session.name} />
      <main className="page-container">

        {/* ── Hero Banner ── */}
        <div className="dash-hero">
          <div className="dash-hero-text">
            <p className="dash-hero-greeting">Welcome back, {firstName} 👋</p>
            <h1 className="dash-hero-title">Dhansampatti Finance</h1>
            <p className="dash-hero-sub">Loan Management Portal — Admin Overview</p>
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
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="kpi-value">{stats.totalCPs}</div>
            <div className="kpi-label">Channel Partners</div>
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
          <a href="/dashboard/admin/leads" className="quick-link-card">
            <div className="ql-icon ic-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div>
              <div className="ql-title">Manage Leads</div>
              <div className="ql-sub">Add, edit, search and filter all leads across all partners</div>
            </div>
            <svg className="ql-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </a>

          <a href="/dashboard/admin/channel-partners" className="quick-link-card">
            <div className="ql-icon ic-purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <div className="ql-title">Channel Partners</div>
              <div className="ql-sub">Manage partner accounts, credentials and lead assignments</div>
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
