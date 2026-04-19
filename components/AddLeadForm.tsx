'use client';

import { useState, useEffect, FormEvent } from 'react';

interface LoanType  { id: number; loan_type: string; }
interface LeadStatus { id: number; lead_status: string; }

// Statuses only applicable to Home Loan / LAP
const PROPERTY_ONLY = new Set(['Legal & Technical', 'Transaction', 'PDD Clearance']);
const PROPERTY_LOANS = new Set(['Home Loan', 'Loan Against Property (LAP)']);

interface Props {
  onSuccess?: () => void;
}

export default function AddLeadForm({ onSuccess }: Props) {
  const [loanTypes, setLoanTypes]   = useState<LoanType[]>([]);
  const [statuses, setStatuses]     = useState<LeadStatus[]>([]);

  const [fullName, setFullName]     = useState('');
  const [phone, setPhone]           = useState('');
  const [dob, setDob]               = useState('');
  const [statusId, setStatusId]     = useState('');
  const [loanNumber, setLoanNumber] = useState('');
  const [loanTypeId, setLoanTypeId] = useState('');

  const [loading, setLoading]       = useState(false);
  const [toast, setToast]           = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetch('/api/meta').then(r => r.json()).then(d => {
      setLoanTypes(d.loanTypes);
      setStatuses(d.leadStatuses);
    });
  }, []);

  // Current loan type name for filtering statuses
  const selectedLoanTypeName = loanTypes.find(l => l.id === Number(loanTypeId))?.loan_type ?? '';

  const visibleStatuses = statuses.filter(s =>
    PROPERTY_ONLY.has(s.lead_status) ? PROPERTY_LOANS.has(selectedLoanTypeName) : true,
  );

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, phone, dob: dob || null, status_id: Number(statusId), loan_number: loanNumber || null, loan_type_id: Number(loanTypeId) }),
    });

    setLoading(false);

    if (!res.ok) {
      const d = await res.json();
      showToast(d.error ?? 'Failed to add lead.', 'error');
      return;
    }

    showToast('Lead added successfully!', 'success');
    setFullName(''); setPhone(''); setDob(''); setStatusId(''); setLoanNumber(''); setLoanTypeId('');
    onSuccess?.();
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          <div className="field">
            <label htmlFor="lf-fullname">Full Name</label>
            <input id="lf-fullname" type="text" placeholder="Rajesh Kumar" value={fullName} onChange={e => setFullName(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="lf-phone">Phone <span style={{color:'var(--danger)'}}>*</span></label>
            <input id="lf-phone" type="tel" placeholder="9876543210" value={phone} onChange={e => setPhone(e.target.value)} required />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="lf-dob">Date of Birth</label>
            <input id="lf-dob" type="date" value={dob} onChange={e => setDob(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="lf-loan-type">Loan Type <span style={{color:'var(--danger)'}}>*</span></label>
            <select id="lf-loan-type" value={loanTypeId} onChange={e => { setLoanTypeId(e.target.value); setStatusId(''); }} required>
              <option value="">Select type</option>
              {loanTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.loan_type}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="lf-status">Status <span style={{color:'var(--danger)'}}>*</span></label>
            <select id="lf-status" value={statusId} onChange={e => setStatusId(e.target.value)} required>
              <option value="">Select status</option>
              {visibleStatuses.map(s => <option key={s.id} value={s.id}>{s.lead_status}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="lf-loan-num">Loan Number <span className="opt">(optional)</span></label>
            <input id="lf-loan-num" type="text" placeholder="LN-00123" value={loanNumber} onChange={e => setLoanNumber(e.target.value)} />
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-sm" disabled={loading} style={{ marginTop: 4 }}>
          {loading ? <span className="spinner" /> : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Lead
            </>
          )}
        </button>
      </form>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </>
  );
}
