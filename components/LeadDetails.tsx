'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Modal from '@/components/Modal';
import { toast } from '@/components/ToastContainer';
import StatusBadge from '@/components/StatusBadge';
import LeadForm from '@/components/LeadForm';
import { Lead, LoanType, LeadStatus, ChannelPartner } from '@/components/lead-types';

interface Comment {
  id: number;
  comment_text: string;
  user_name: string;
  new_status_name?: string;
  created_at: string;
}

interface LeadDetailsProps {
  isAdmin: boolean;
  leadId: string;
}

export default function LeadDetails({ isAdmin, leadId }: LeadDetailsProps) {
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  
  // Meta data for Edit form and Timeline
  const [loanTypes, setLoanTypes] = useState<LoanType[]>([]);
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [channelPartners, setChannelPartners] = useState<ChannelPartner[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Timeline Form
  const [commentText, setCommentText] = useState('');
  const [timelineStatusId, setTimelineStatusId] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // Modals
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const backLink = isAdmin ? '/dashboard/admin/leads' : '/dashboard/cp/leads';

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [metaRes, leadRes, commentsRes, cpRes] = await Promise.all([
          fetch('/api/meta').then(r => r.json()),
          fetch(`/api/leads/${leadId}`).then(r => r.json()),
          fetch(`/api/leads/${leadId}/comments`).then(r => r.json()),
          isAdmin ? fetch('/api/users/channel-partners').then(r => r.json()) : Promise.resolve([]),
        ]);

        if (leadRes.error) {
          setError(leadRes.error);
        } else {
          setLead(leadRes);
          setTimelineStatusId(String(leadRes.status_id));
        }

        if (commentsRes.comments) {
          setComments(commentsRes.comments);
        }

        setLoanTypes(metaRes.loanTypes ?? []);
        setStatuses(metaRes.leadStatuses ?? []);
        setChannelPartners(cpRes ?? []);

      } catch (err: any) {
        setError('Failed to load lead details.');
      }
      setLoading(false);
    }
    loadData();
  }, [leadId, isAdmin]);

  async function handlePostComment(e: FormEvent) {
    e.preventDefault();
    if (!commentText.trim() && String(lead?.status_id) === timelineStatusId) {
      toast('Please enter a comment or change the status.', 'error');
      return;
    }

    setPostingComment(true);
    const res = await fetch(`/api/leads/${leadId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        comment_text: commentText,
        status_id: timelineStatusId,
      }),
    });
    setPostingComment(false);

    if (!res.ok) {
      const d = await res.json().catch(() => ({ error: 'Error' }));
      toast(d.error ?? 'Failed to post update.', 'error');
      return;
    }

    const newComment = await res.json();
    setComments([newComment, ...comments]);
    setCommentText('');
    toast('Update posted successfully.', 'success');

    // Update lead status in the local state if it changed
    if (String(lead?.status_id) !== timelineStatusId) {
      const newStatusObj = statuses.find(s => s.id === Number(timelineStatusId));
      if (newStatusObj && lead) {
        setLead({ ...lead, status_id: newStatusObj.id, lead_status: newStatusObj.lead_status });
      }
    }
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
    setDeleting(false);
    
    if (!res.ok) {
      const d = await res.json();
      toast(d.error ?? 'Failed to delete lead.', 'error');
      return;
    }
    
    toast('Lead deleted.', 'success');
    router.push(backLink);
  }

  async function handleAssignToMe() {
    if (!lead) return;
    const res = await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...lead,
        cp_id: undefined // Backend will use session.userId if not admin, or admin's own ID if cp_id is missing/same
      }),
    });

    if (!res.ok) {
      toast('Failed to assign lead.', 'error');
      return;
    }
    const updated = await res.json();
    // Assuming backend returns the updated lead
    // I need to reload to get cp_name populated correctly or just mutate
    // Let's just reload the data
    const leadRes = await fetch(`/api/leads/${leadId}`).then(r => r.json());
    setLead(leadRes);
    toast('Assigned successfully.', 'success');
  }

  if (loading) {
    return (
      <div className="page-container" style={{ padding: '2rem' }}>
         <div className="skeleton-cell w-160" style={{ height: 20, marginBottom: 20 }} />
         <div className="card table-skeleton" style={{ padding: '2rem' }}>
            <div className="skeleton-row"><div className="skeleton-cell w-200" /><div className="skeleton-cell w-120" /></div>
            <div className="skeleton-row"><div className="skeleton-cell w-160" /><div className="skeleton-cell w-100" /></div>
            <div className="skeleton-row"><div className="skeleton-cell w-140" /><div className="skeleton-cell w-80" /></div>
         </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="page-container" style={{ padding: '2rem' }}>
        <Link href={backLink} className="text-primary hover-underline mb-4 inline-block">
          &lt; Back to Leads
        </Link>
        <div className="empty-state card">
          <p>{error || 'Lead not found.'}</p>
          <button className="btn btn-primary btn-sm mt-4" onClick={() => router.push(backLink)}>Go Back</button>
        </div>
      </div>
    );
  }

  const selectedLoanTypeName = loanTypes.find(l => l.id === Number(lead.loan_type_id))?.loan_type ?? '';
  const PROPERTY_ONLY  = new Set(['Legal & Technical', 'Transaction', 'PDD Clearance']);
  const PROPERTY_LOANS = new Set(['Home Loan', 'Loan Against Property (LAP)']);

  const visibleStatuses = statuses.filter(s =>
    PROPERTY_ONLY.has(s.lead_status) ? PROPERTY_LOANS.has(selectedLoanTypeName) : true,
  );

  return (
    <>
      <div className="page-container pb-8">
        <div className="mb-4">
          <Link href={backLink} className="text-gray-500 hover:text-gray-900" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', color: 'var(--gray-500)', textDecoration: 'none' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            Back to Leads
          </Link>
        </div>

        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: 'var(--gray-900)' }}>{lead.full_name}</h1>
                <StatusBadge status={lead.lead_status} />
              </div>
              <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
                {lead.cp_email || lead.full_name.toLowerCase().replace(' ', '') + '@gmail.com'} {/* Fallback for visual parity if email not present */}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <a href={`tel:${lead.phone}`} className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--gray-200)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                Call
              </a>
              <a href={`https://wa.me/91${lead.phone}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{ backgroundColor: '#25D366', color: '#fff', border: 'none' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                WhatsApp
              </a>
              <button onClick={handleAssignToMe} className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--gray-200)', color: 'var(--primary)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                Assign to Me
              </button>
              <button onClick={() => setEditOpen(true)} className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--gray-200)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit
              </button>
              <button onClick={() => setDeleteOpen(true)} className="btn btn-danger btn-sm" style={{ backgroundColor: 'var(--red-50)', color: 'var(--red-600)', border: 'none' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                Delete
              </button>
            </div>
          </div>

          {/* Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ color: 'var(--gray-500)', fontSize: '0.85rem', marginBottom: '4px' }}>Phone</div>
              <div style={{ fontWeight: 500, color: 'var(--gray-900)' }}>{lead.phone}</div>
            </div>
            <div>
              <div style={{ color: 'var(--gray-500)', fontSize: '0.85rem', marginBottom: '4px' }}>Location</div>
              <div style={{ fontWeight: 500, color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--gray-400)' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                {lead.location || 'India'}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--gray-500)', fontSize: '0.85rem', marginBottom: '4px' }}>Owner</div>
              <div style={{ fontWeight: 500, color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--gray-400)' }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                {lead.created_by_name || 'System'}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ color: 'var(--gray-500)', fontSize: '0.85rem', marginBottom: '4px' }}>Assigned To</div>
              <div style={{ fontWeight: 500, color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--gray-400)' }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                {lead.cp_name || 'Unassigned'}
              </div>
            </div>
            {lead.loan_type && (
              <div>
                <div style={{ color: 'var(--gray-500)', fontSize: '0.85rem', marginBottom: '4px' }}>Loan Type</div>
                <div style={{ fontWeight: 500, color: 'var(--gray-900)' }}>{lead.loan_type} {lead.loan_amount ? `(₹${lead.loan_amount})` : ''}</div>
              </div>
            )}
            {lead.company && (
              <div>
                <div style={{ color: 'var(--gray-500)', fontSize: '0.85rem', marginBottom: '4px' }}>Company</div>
                <div style={{ fontWeight: 500, color: 'var(--gray-900)' }}>{lead.company}</div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
             <div style={{ color: 'var(--gray-500)', fontSize: '0.85rem', marginBottom: '4px' }}>Note</div>
             <div style={{ backgroundColor: 'var(--gray-50)', padding: '12px', borderRadius: '6px', color: 'var(--gray-800)', fontSize: '0.95rem' }}>
               {(lead as any).remark || lead.occupation || 'No notes available.'}
               {lead.salary && ` - Salary: ₹${lead.salary}`}
               {lead.turnover && ` - Turnover: ₹${lead.turnover}`}
             </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--gray-400)', fontSize: '0.8rem', borderTop: '1px solid var(--gray-100)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              Created: {new Date(lead.created_at).toLocaleString('en-IN')}
            </div>
            {/* Using created_at for Last Edited for now since we don't fetch updated_at explicitly in all APIs, but if available use it */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              Last Edited: {new Date((lead as any).updated_at || lead.created_at).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--gray-900)', marginBottom: '1rem' }}>Comments & Timeline</h2>
        
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <form onSubmit={handlePostComment} style={{ marginBottom: '2rem' }}>
            <textarea 
              placeholder="Add a comment or update..." 
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              style={{ width: '100%', minHeight: '80px', padding: '12px', border: '1px solid var(--gray-200)', borderRadius: '6px', marginBottom: '1rem', resize: 'vertical', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center' }}>
              <select 
                value={timelineStatusId} 
                onChange={e => setTimelineStatusId(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid var(--gray-200)', borderRadius: '6px', backgroundColor: '#fff' }}
              >
                {visibleStatuses.map(s => (
                  <option key={s.id} value={s.id}>{s.lead_status}</option>
                ))}
              </select>
              <button type="submit" className="btn btn-primary" disabled={postingComment} style={{ backgroundColor: 'var(--gray-900)', color: '#fff', border: 'none', padding: '8px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {postingComment ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    Post
                  </>
                )}
              </button>
            </div>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {comments.map(c => (
              <div key={c.id} style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-600)', fontWeight: 600, flexShrink: 0 }}>
                  {c.user_name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{c.user_name}</div>
                    <div style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>
                      {new Date(c.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {c.comment_text && (
                    <div style={{ color: 'var(--gray-700)', fontSize: '0.95rem', marginBottom: '8px', whiteSpace: 'pre-wrap' }}>
                      {c.comment_text}
                    </div>
                  )}
                  {c.new_status_name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', marginTop: c.comment_text ? '8px' : '0' }}>
                       <span style={{ color: 'var(--gray-500)' }}>Status updated to</span>
                       <span style={{ color: 'var(--primary)', backgroundColor: 'var(--primary-50)', padding: '2px 8px', borderRadius: '12px', fontWeight: 500, fontSize: '0.8rem' }}>{c.new_status_name}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '2rem 0' }}>
                No activity yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Lead Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Lead">
        {lead && (
          <LeadForm
            initial={lead}
            isAdmin={isAdmin}
            loanTypes={loanTypes}
            statuses={statuses}
            channelPartners={channelPartners}
            onSuccess={async () => {
              const leadRes = await fetch(`/api/leads/${leadId}`).then(r => r.json());
              setLead(leadRes);
              setTimelineStatusId(String(leadRes.status_id));
            }}
            onClose={() => setEditOpen(false)}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Lead" width={420}>
        <p style={{ color: 'var(--gray-600)', marginBottom: '1rem' }}>
          Are you sure you want to delete the lead for <strong>{lead.full_name}</strong>?
          This action cannot be undone.
        </p>
        <div className="modal-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => setDeleteOpen(false)}>Cancel</button>
          <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? <span className="spinner" /> : 'Delete Lead'}
          </button>
        </div>
      </Modal>
    </>
  );
}
