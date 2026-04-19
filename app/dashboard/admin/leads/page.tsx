import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import sql from '@/lib/db';
import Header from '@/components/Header';
import LeadsTable from '@/components/LeadsTable';
import type { Metadata } from 'next';

interface LeadRow {
  id: string; full_name: string; phone: string; dob?: string;
  lead_status: string; loan_type: string; loan_number?: string;
  cp_name: string; created_at: string;
}

export const metadata: Metadata = { title: 'All Leads — Dhansampatti Finance' };

export default async function AdminLeadsPage() {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/login');

  const leads = await sql`
    SELECT l.id, l.full_name, l.phone, l.dob, l.loan_number, l.created_at,
           ls.lead_status, lt.loan_type, u.name AS cp_name
    FROM leads l
    JOIN lead_statuses ls ON ls.id = l.status_id
    JOIN loan_types    lt ON lt.id = l.loan_type_id
    JOIN users          u ON u.id  = l.cp_id
    ORDER BY l.created_at DESC
  `;

  return (
    <>
      <Header role="admin" userName={session.name} />
      <main className="page-container">
        <div className="section-header">
          <h1 className="section-title">All Leads</h1>
          <span style={{ fontSize: '.8125rem', color: 'var(--gray-400)' }}>{leads.length} total</span>
        </div>
        <div className="card" style={{ padding: '4px 0' }}>
          <LeadsTable leads={leads as LeadRow[]} />
        </div>
      </main>
    </>
  );
}
