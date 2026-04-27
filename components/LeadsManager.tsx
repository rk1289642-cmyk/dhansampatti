'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import Modal from '@/components/Modal';
import { toast } from '@/components/ToastContainer';

// ── Types ─────────────────────────────────────────────────────

interface LoanType   { id: number; loan_type: string; }
interface LeadStatus { id: number; lead_status: string; }
interface ChannelPartner { id: string; name: string; }

interface Lead {
  id: string;
  full_name: string;
  phone: string;
  dob?: string;
  lead_status: string;
  loan_type: string;
  loan_number?: string;
  cp_name: string;
  cp_id: string;
  status_id: number;
  loan_type_id: number;
  created_at: string;
}

interface Pagination {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ── Constants ─────────────────────────────────────────────────

const PROPERTY_ONLY  = new Set(['Legal & Technical', 'Transaction', 'PDD Clearance']);
const PROPERTY_LOANS = new Set(['Home Loan', 'Loan Against Property (LAP)']);

const STATUS_COLOR: Record<string, string> = {
  'Lead Created':    'badge-blue',
  'Login':           'badge-amber',
  'Sanction':        'badge-green',
  'Disbursal':       'badge-purple',
  'Rejected':        'badge-red',
  'Legal & Technical': 'badge-gray',
  'Transaction':     'badge-gray',
  'PDD Clearance':   'badge-gray',
};

// ── Sub-components ─────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${STATUS_COLOR[status] ?? 'badge-gray'}`}>{status}</span>;
}

// ── Validation helpers ────────────────────────────────────────

/** Calendar max: today minus 18 years */
function maxDobDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split('T')[0];
}

/** True when dateStr represents a person aged ≥ 18 */
function isAtLeast18(dateStr: string): boolean {
  if (!dateStr) return true;
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 18);
  return new Date(dateStr) <= cutoff;
}

/** True for a valid 10-digit Indian mobile number (starts 6–9) */
function isValidIndianMobile(v: string): boolean {
  return /^[6-9]\d{9}$/.test(v.trim());
}

// ── Lead Form (shared for Add + Edit) ─────────────────────────

interface LeadFormProps {
  initial?: Partial<Lead>;
  isAdmin: boolean;
  loanTypes: LoanType[];
  statuses: LeadStatus[];
  channelPartners: ChannelPartner[];
  onSuccess: () => void;
  onClose: () => void;
}

function LeadForm({ initial, isAdmin, loanTypes, statuses, channelPartners, onSuccess, onClose }: LeadFormProps) {
  const isEdit = Boolean(initial?.id);

  const [fullName,    setFullName]    = useState(initial?.full_name   ?? '');
  const [phone,       setPhone]       = useState(initial?.phone       ?? '');
  const [dob,         setDob]         = useState(initial?.dob         ? initial.dob.split('T')[0] : '');
  const [statusId,    setStatusId]    = useState(String(initial?.status_id    ?? ''));
  const [loanNumber,  setLoanNumber]  = useState(initial?.loan_number  ?? '');
  const [loanTypeId,  setLoanTypeId]  = useState(String(initial?.loan_type_id ?? ''));
  const [cpId,        setCpId]        = useState(initial?.cp_id        ?? '');
  const [loading,     setLoading]     = useState(false);

  // Inline validation errors
  const [phoneError, setPhoneError]   = useState('');
  const [dobError,   setDobError]     = useState('');

  const selectedLoanTypeName = loanTypes.find(l => l.id === Number(loanTypeId))?.loan_type ?? '';
  const visibleStatuses = statuses.filter(s =>
    PROPERTY_ONLY.has(s.lead_status) ? PROPERTY_LOANS.has(selectedLoanTypeName) : true,
  );

  function validatePhone(value: string) {
    if (!value)                    { setPhoneError('Mobile number is required.'); return false; }
    if (!/^\d+$/.test(value))      { setPhoneError('Only digits are allowed.'); return false; }
    if (!isValidIndianMobile(value)) { setPhoneError('Enter a valid 10-digit number (starts with 6–9).'); return false; }
    setPhoneError('');
    return true;
  }

  function validateDob(value: string) {
    if (!value)               { setDobError(''); return true; }
    if (!isAtLeast18(value))  { setDobError('Applicant must be at least 18 years old.'); return false; }
    setDobError('');
    return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const phoneOk = validatePhone(phone);
    const dobOk   = validateDob(dob);
    if (!phoneOk || !dobOk) return;
    setLoading(true);

    const body = {
      full_name:    fullName,
      phone,
      dob:          dob || null,
      status_id:    Number(statusId),
      loan_number:  loanNumber || null,
      loan_type_id: Number(loanTypeId),
      ...(isAdmin && { cp_id: cpId || undefined }),
    };

    const url    = isEdit ? `/api/leads/${initial!.id}` : '/api/leads';
    const method = isEdit ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!res.ok) {
      const d = await res.json();
      toast(d.error ?? 'Failed to save lead.', 'error');
      return;
    }

    toast(isEdit ? 'Lead updated successfully!' : 'Lead added successfully!', 'success');
    onSuccess();
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-row">
        <div className="field">
          <label htmlFor="lf-fullname">Full Name <span className="req">*</span></label>
          <input id="lf-fullname" type="text" placeholder="Rajesh Kumar" value={fullName} onChange={e => setFullName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="lf-phone">Phone <span className="req">*</span></label>
          <input
            id="lf-phone"
            type="tel"
            inputMode="numeric"
            placeholder="9876543210"
            maxLength={10}
            value={phone}
            onChange={e => {
              const val = e.target.value.replace(/\D/g, '');
              setPhone(val);
              if (phoneError) validatePhone(val);
            }}
            onBlur={() => validatePhone(phone)}
            required
          />
          {phoneError && <span className="field-error">{phoneError}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="lf-dob">Date of Birth</label>
          <input
            id="lf-dob"
            type="date"
            max={maxDobDate()}
            value={dob}
            onChange={e => {
              setDob(e.target.value);
              if (dobError) validateDob(e.target.value);
            }}
            onBlur={() => validateDob(dob)}
          />
          {dobError && <span className="field-error">{dobError}</span>}
        </div>
        <div className="field">
          <label htmlFor="lf-loan-type">Loan Type <span className="req">*</span></label>
          <select id="lf-loan-type" value={loanTypeId} onChange={e => { setLoanTypeId(e.target.value); setStatusId(''); }} required>
            <option value="">Select type</option>
            {loanTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.loan_type}</option>)}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="lf-status">Status <span className="req">*</span></label>
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

      {isAdmin && (
        <div className="field">
          <label htmlFor="lf-cp">Assign Channel Partner <span className="req">*</span></label>
          <select id="lf-cp" value={cpId} onChange={e => setCpId(e.target.value)} required={isAdmin}>
            <option value="">Select channel partner</option>
            {channelPartners.map(cp => <option key={cp.id} value={cp.id}>{cp.name}</option>)}
          </select>
        </div>
      )}

      <div className="modal-actions">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
          {loading ? <span className="spinner" /> : isEdit ? 'Update Lead' : 'Add Lead'}
        </button>
      </div>
    </form>
  );
}

// ── Main Leads Manager ────────────────────────────────────────

interface LeadsManagerProps {
  isAdmin: boolean;
}

export default function LeadsManager({ isAdmin }: LeadsManagerProps) {
  // Meta data
  const [loanTypes,       setLoanTypes]       = useState<LoanType[]>([]);
  const [statuses,        setStatuses]        = useState<LeadStatus[]>([]);
  const [channelPartners, setChannelPartners] = useState<ChannelPartner[]>([]);

  // Table data
  const [leads,      setLeads]      = useState<Lead[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [fetching,   setFetching]   = useState(true);

  // Filters
  const [search,     setSearch]     = useState('');
  const [statusFilt, setStatusFilt] = useState('');
  const [loanFilt,   setLoanFilt]   = useState('');
  const [cpFilt,     setCpFilt]     = useState('');
  const [page,       setPage]       = useState(1);

  // Modals
  const [addOpen,    setAddOpen]    = useState(false);
  const [editLead,   setEditLead]   = useState<Lead | null>(null);
  const [deleteLead, setDeleteLead] = useState<Lead | null>(null);
  const [deleting,   setDeleting]   = useState(false);

  // Load meta once
  useEffect(() => {
    Promise.all([
      fetch('/api/meta').then(r => r.json()),
      isAdmin ? fetch('/api/users/channel-partners').then(r => r.json()) : Promise.resolve([]),
    ]).then(([meta, cps]) => {
      setLoanTypes(meta.loanTypes);
      setStatuses(meta.leadStatuses);
      setChannelPartners(isAdmin ? cps : []);
    });
  }, [isAdmin]);

  // Load leads
  const fetchLeads = useCallback(async (pg = page) => {
    setFetching(true);
    const params = new URLSearchParams();
    if (search)     params.set('search',       search);
    if (statusFilt) params.set('status_id',    statusFilt);
    if (loanFilt)   params.set('loan_type_id', loanFilt);
    if (isAdmin && cpFilt) params.set('cp_id', cpFilt);
    params.set('page', String(pg));
    params.set('per_page', '20');

    const res  = await fetch(`/api/leads?${params}`);
    const data = await res.json();
    setLeads(data.leads ?? []);
    setPagination(data.pagination ?? null);
    setFetching(false);
  }, [search, statusFilt, loanFilt, cpFilt, isAdmin, page]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilt, loanFilt, cpFilt]);

  useEffect(() => {
    fetchLeads(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilt, loanFilt, cpFilt]);

  async function handleDelete() {
    if (!deleteLead) return;
    setDeleting(true);
    const res = await fetch(`/api/leads/${deleteLead.id}`, { method: 'DELETE' });
    setDeleting(false);
    if (!res.ok) {
      const d = await res.json();
      toast(d.error ?? 'Failed to delete lead.', 'error');
      return;
    }
    toast('Lead deleted.', 'success');
    setDeleteLead(null);
    fetchLeads(page);
  }

  // ── Render ──────────────────────────────────────────────────
  return (
    <>
      {/* Toolbar */}
      <div className="table-toolbar">
        <div className="toolbar-search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search name or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="leads-search"
          />
        </div>

        <div className="toolbar-filters">
          <select value={statusFilt} onChange={e => setStatusFilt(e.target.value)} aria-label="Filter by status">
            <option value="">All Statuses</option>
            {statuses.map(s => <option key={s.id} value={s.id}>{s.lead_status}</option>)}
          </select>

          <select value={loanFilt} onChange={e => setLoanFilt(e.target.value)} aria-label="Filter by loan type">
            <option value="">All Loan Types</option>
            {loanTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.loan_type}</option>)}
          </select>

          {isAdmin && (
            <select value={cpFilt} onChange={e => setCpFilt(e.target.value)} aria-label="Filter by channel partner">
              <option value="">All Partners</option>
              {channelPartners.map(cp => <option key={cp.id} value={cp.id}>{cp.name}</option>)}
            </select>
          )}
        </div>

        <button
          className="btn btn-primary btn-sm"
          onClick={() => setAddOpen(true)}
          id="btn-add-lead"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Lead
        </button>
      </div>

      {/* ── Desktop Table ── */}
      <div className="table-wrapper desktop-only">
        {fetching ? (
          <div className="table-skeleton">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton-row">
                <div className="skeleton-cell w-200" />
                <div className="skeleton-cell w-120" />
                <div className="skeleton-cell w-160" />
                <div className="skeleton-cell w-100" />
                <div className="skeleton-cell w-140" />
                <div className="skeleton-cell w-80"  />
              </div>
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <p>No leads found.</p>
            <button className="btn btn-primary btn-sm" onClick={() => setAddOpen(true)}>Add your first lead</button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Phone</th><th>Loan Type</th><th>Status</th>
                <th>Loan No.</th>{isAdmin && <th>Channel Partner</th>}
                <th>Added</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(l => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 500, color: 'var(--gray-900)' }}>{l.full_name}</td>
                  <td>{l.phone}</td>
                  <td>{l.loan_type}</td>
                  <td><StatusBadge status={l.lead_status} /></td>
                  <td style={{ color: 'var(--gray-500)' }}>{l.loan_number ?? '—'}</td>
                  {isAdmin && <td>{l.cp_name}</td>}
                  <td style={{ color: 'var(--gray-400)', fontSize: '.8rem' }}>
                    {new Date(l.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="action-btn" title="Edit lead" onClick={() => setEditLead(l)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className="action-btn danger" title="Delete lead" onClick={() => setDeleteLead(l)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Mobile Card List ── */}
      <div className="mobile-only">
        {fetching ? (
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="mobile-card-skeleton">
                <div className="skeleton-cell w-160" style={{ height: 16, marginBottom: 8 }} />
                <div className="skeleton-cell w-120" style={{ height: 12 }} />
              </div>
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <p>No leads found.</p>
            <button className="btn btn-primary btn-sm" onClick={() => setAddOpen(true)}>Add your first lead</button>
          </div>
        ) : (
          <div className="lead-card-list">
            {leads.map(l => (
              <div key={l.id} className="lead-card">
                <div className="lead-card-top">
                  <div>
                    <div className="lead-card-name">{l.full_name}</div>
                    <div className="lead-card-phone">{l.phone}</div>
                  </div>
                  <StatusBadge status={l.lead_status} />
                </div>
                <div className="lead-card-meta">
                  <span className="lead-card-tag">{l.loan_type}</span>
                  {l.loan_number && <span className="lead-card-tag muted">#{l.loan_number}</span>}
                  {isAdmin && <span className="lead-card-tag muted">{l.cp_name}</span>}
                </div>
                <div className="lead-card-footer">
                  <span className="lead-card-date">
                    {new Date(l.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <div className="action-btns">
                    <button className="action-btn" onClick={() => setEditLead(l)} title="Edit">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button className="action-btn danger" onClick={() => setDeleteLead(l)} title="Delete">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="pagination">
          <span className="pagination-info">
            Showing {(pagination.page - 1) * pagination.per_page + 1}–{Math.min(pagination.page * pagination.per_page, pagination.total)} of {pagination.total}
          </span>
          <div className="pagination-btns">
            <button
              className="btn btn-ghost btn-sm"
              disabled={pagination.page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              ← Prev
            </button>
            <span className="pagination-page">{pagination.page} / {pagination.total_pages}</span>
            <button
              className="btn btn-ghost btn-sm"
              disabled={pagination.page >= pagination.total_pages}
              onClick={() => setPage(p => p + 1)}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New Lead">
        <LeadForm
          isAdmin={isAdmin}
          loanTypes={loanTypes}
          statuses={statuses}
          channelPartners={channelPartners}
          onSuccess={() => fetchLeads(1)}
          onClose={() => setAddOpen(false)}
        />
      </Modal>

      {/* Edit Lead Modal */}
      <Modal open={Boolean(editLead)} onClose={() => setEditLead(null)} title="Edit Lead">
        {editLead && (
          <LeadForm
            initial={editLead}
            isAdmin={isAdmin}
            loanTypes={loanTypes}
            statuses={statuses}
            channelPartners={channelPartners}
            onSuccess={() => fetchLeads(page)}
            onClose={() => setEditLead(null)}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={Boolean(deleteLead)} onClose={() => setDeleteLead(null)} title="Delete Lead" width={420}>
        <p style={{ color: 'var(--gray-600)', marginBottom: 8 }}>
          Are you sure you want to delete the lead for <strong>{deleteLead?.full_name}</strong>?
          This action cannot be undone.
        </p>
        <div className="modal-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => setDeleteLead(null)}>Cancel</button>
          <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? <span className="spinner" /> : 'Delete Lead'}
          </button>
        </div>
      </Modal>
    </>
  );
}
