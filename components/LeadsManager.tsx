'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import Modal from '@/components/Modal';
import { toast } from '@/components/ToastContainer';
import { BANK_NAMES } from '@/lib/constants';

import Link from 'next/link';
import { Lead, LoanType, LeadStatus, ChannelPartner } from './lead-types';
import StatusBadge from './StatusBadge';
import LeadForm from './LeadForm';

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
  const [pagination, setPagination] = useState<{total: number; page: number; per_page: number; total_pages: number} | null>(null);
  const [fetching,   setFetching]   = useState(true);

  // Filters
  const [search,     setSearch]     = useState('');
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
      fetch('/api/meta').then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json(); }),
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
    if (loanFilt)   params.set('loan_type_id', loanFilt);
    if (isAdmin && cpFilt) params.set('cp_id', cpFilt);
    params.set('page', String(pg));
    params.set('per_page', '20');

    const res  = await fetch(`/api/leads?${params}`);
    const data = await res.json();
    setLeads(data.leads ?? []);
    setPagination(data.pagination ?? null);
    setFetching(false);
  }, [search, loanFilt, cpFilt, isAdmin, page]);

  useEffect(() => {
    setPage(1);
  }, [search, loanFilt, cpFilt]);

  useEffect(() => {
    fetchLeads(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, loanFilt, cpFilt]);

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
                <th>Name</th><th>Phone</th><th>Loan Type</th>
                <th>Loan No.</th>{isAdmin && <th>Channel Partner</th>}
                <th>Added</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(l => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 500, color: 'var(--gray-900)' }}>
                    <Link href={isAdmin ? `/dashboard/admin/leads/${l.id}` : `/dashboard/cp/leads/${l.id}`} className="text-primary hover-underline">
                      {l.full_name}
                    </Link>
                  </td>
                  <td>{l.phone}</td>
                  <td>{l.loan_type}</td>
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
                    <div className="lead-card-name">
                      <Link href={isAdmin ? `/dashboard/admin/leads/${l.id}` : `/dashboard/cp/leads/${l.id}`} className="text-primary hover-underline">
                        {l.full_name}
                      </Link>
                    </div>
                    <div className="lead-card-phone">{l.phone}</div>
                  </div>
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
