interface Lead {
  id: string;
  full_name: string;
  phone: string;
  dob?: string;
  lead_status: string;
  loan_type: string;
  loan_number?: string;
  cp_name: string;
  created_at: string;
}

const STATUS_COLOR: Record<string, string> = {
  'Lead Created': 'badge-blue',
  'Login':        'badge-amber',
  'Sanction':     'badge-green',
  'Disbursal':    'badge-purple',
  'Rejected':     'badge-red',
};

function statusBadge(status: string) {
  const cls = STATUS_COLOR[status] ?? 'badge-gray';
  return <span className={`badge ${cls}`}>{status}</span>;
}

export default function LeadsTable({ leads }: { leads: Lead[] }) {
  if (!leads.length) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--gray-400)' }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 8px', display: 'block' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        No leads found.
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Loan Type</th>
            <th>Status</th>
            <th>Loan No.</th>
            <th>Channel Partner</th>
            <th>Added</th>
          </tr>
        </thead>
        <tbody>
          {leads.map(l => (
            <tr key={l.id}>
              <td style={{ fontWeight: 500, color: 'var(--gray-900)' }}>{l.full_name}</td>
              <td>{l.phone}</td>
              <td>{l.loan_type}</td>
              <td>{statusBadge(l.lead_status)}</td>
              <td style={{ color: 'var(--gray-500)' }}>{l.loan_number ?? '—'}</td>
              <td>{l.cp_name}</td>
              <td style={{ color: 'var(--gray-400)', fontSize: '.8rem' }}>
                {new Date(l.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
