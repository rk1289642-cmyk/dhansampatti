'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import Modal from '@/components/Modal';
import { toast } from '@/components/ToastContainer';

// ── Types ─────────────────────────────────────────────────────

interface ChannelPartner {
  id: string;
  name: string;
  email: string;
  gender: string | null;
  address: string | null;
  cp_email: string | null;
  pan_card: string | null;
  lead_count: string;
  created_at: string;
}

// ── Partner Form ──────────────────────────────────────────────

interface PartnerFormProps {
  initial?: Partial<ChannelPartner>;
  onSuccess: () => void;
  onClose: () => void;
}

// PAN format: 5 uppercase letters + 4 digits + 1 uppercase letter
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

function PartnerForm({ initial, onSuccess, onClose }: PartnerFormProps) {
  const isEdit = Boolean(initial?.id);

  const [name,      setName]      = useState(initial?.name      ?? '');
  const [email,     setEmail]     = useState(initial?.email     ?? '');
  const [password,  setPassword]  = useState('');
  const [address,   setAddress]   = useState(initial?.address   ?? '');
  const [gender,    setGender]    = useState(initial?.gender    ?? '');
  const [cpEmail,   setCpEmail]   = useState(initial?.cp_email  ?? '');
  const [panCard,   setPanCard]   = useState(initial?.pan_card  ?? '');
  const [loading,   setLoading]   = useState(false);
  const [showPass,  setShowPass]  = useState(false);

  // PAN validation
  const panFilled  = panCard.trim().length > 0;
  const panInvalid = panFilled && !PAN_REGEX.test(panCard);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (panInvalid) {
      toast('Please enter a valid PAN card number (e.g. ABCDE1234F).', 'error');
      return;
    }

    setLoading(true);

    const body: Record<string, string | null> = {
      name, email, address: address || null,
      gender: gender || null, cp_email: cpEmail || null,
      pan_card: panCard.trim() || null,
    };
    if (password) body.password = password;

    const url    = isEdit ? `/api/users/channel-partners/${initial!.id}` : '/api/users/channel-partners';
    const method = isEdit ? 'PATCH' : 'POST';

    if (!isEdit && !password) {
      toast('Password is required for new channel partners.', 'error');
      setLoading(false);
      return;
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!res.ok) {
      const d = await res.json();
      toast(d.error ?? 'Failed to save channel partner.', 'error');
      return;
    }

    toast(isEdit ? 'Channel partner updated!' : 'Channel partner added!', 'success');
    onSuccess();
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-row">
        <div className="field">
          <label htmlFor="pf-name">Full Name <span className="req">*</span></label>
          <input id="pf-name" type="text" placeholder="Priya Sharma" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="pf-email">Email <span className="req">*</span></label>
          <input id="pf-email" type="email" placeholder="priya@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="pf-password">
            Password {isEdit ? <span className="opt">(leave blank to keep current)</span> : <span className="req">*</span>}
          </label>
          <div className="input-icon-wrapper">
            <input
              id="pf-password"
              type={showPass ? 'text' : 'password'}
              placeholder={isEdit ? '••••••••' : 'Min. 8 characters'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required={!isEdit}
            />
            <button type="button" className="input-icon-btn" onClick={() => setShowPass(p => !p)} aria-label="Toggle password visibility">
              {showPass ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>
        <div className="field">
          <label htmlFor="pf-gender">Gender</label>
          <select id="pf-gender" value={gender} onChange={e => setGender(e.target.value)}>
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="pf-address">Address</label>
        <input id="pf-address" type="text" placeholder="123 MG Road, Bengaluru" value={address} onChange={e => setAddress(e.target.value)} />
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="pf-cp-email">Office Email <span className="opt">(optional)</span></label>
          <input id="pf-cp-email" type="email" placeholder="office@firm.com" value={cpEmail} onChange={e => setCpEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="pf-pan">
            PAN Card
            <span className="opt"> — format: AAAAA9999A</span>
          </label>
          <input
            id="pf-pan"
            type="text"
            placeholder="ABCDE1234F"
            maxLength={10}
            value={panCard}
            onChange={e => setPanCard(e.target.value.toUpperCase())}
            style={panInvalid ? { borderColor: 'var(--warning)', boxShadow: '0 0 0 3px rgba(217,119,6,.12)' } : undefined}
          />
          {panInvalid && (
            <div className="pan-warning">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Invalid format. Must be 5 letters + 4 digits + 1 letter (e.g. ABCDE1234F).
            </div>
          )}
          {panFilled && !panInvalid && (
            <div className="pan-valid">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Valid PAN format
            </div>
          )}
        </div>
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={loading || panInvalid}>
          {loading ? <span className="spinner" /> : isEdit ? 'Update Partner' : 'Add Partner'}
        </button>
      </div>
    </form>
  );
}

// ── Main Channel Partners Manager ─────────────────────────────

export default function ChannelPartnersManager() {
  const [partners,     setPartners]     = useState<ChannelPartner[]>([]);
  const [fetching,     setFetching]     = useState(true);
  const [addOpen,      setAddOpen]      = useState(false);
  const [editPartner,  setEditPartner]  = useState<ChannelPartner | null>(null);
  const [deletePartner,setDeletePartner]= useState<ChannelPartner | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  const fetchPartners = useCallback(async () => {
    setFetching(true);
    const res  = await fetch('/api/users/channel-partners');
    const data = await res.json();
    setPartners(Array.isArray(data) ? data : []);
    setFetching(false);
  }, []);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  async function handleDelete() {
    if (!deletePartner) return;
    setDeleting(true);
    const res = await fetch(`/api/users/channel-partners/${deletePartner.id}`, { method: 'DELETE' });
    setDeleting(false);
    if (!res.ok) {
      const d = await res.json();
      toast(d.error ?? 'Failed to delete channel partner.', 'error');
      return;
    }
    toast('Channel partner deleted.', 'success');
    setDeletePartner(null);
    fetchPartners();
  }

  return (
    <>
      {/* Toolbar */}
      <div className="table-toolbar" style={{ borderBottom: 0, paddingBottom: 0 }}>
        <div style={{ flex: 1 }} />
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setAddOpen(true)}
          id="btn-add-partner"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Partner
        </button>
      </div>

      {/* Desktop Table */}
      <div className="table-wrapper desktop-only">
        {fetching ? (
          <div className="table-skeleton">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton-row">
                <div className="skeleton-cell w-160" /><div className="skeleton-cell w-200" />
                <div className="skeleton-cell w-80"  /><div className="skeleton-cell w-120" />
                <div className="skeleton-cell w-100" /><div className="skeleton-cell w-80"  />
              </div>
            ))}
          </div>
        ) : partners.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <p>No channel partners yet.</p>
            <button className="btn btn-primary btn-sm" onClick={() => setAddOpen(true)}>Add your first partner</button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Gender</th>
                <th>Office Email</th><th>PAN Card</th><th>Leads</th>
                <th>Joined</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {partners.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500, color: 'var(--gray-900)' }}>{p.name}</td>
                  <td>{p.email}</td>
                  <td style={{ textTransform: 'capitalize' }}>{p.gender ?? '—'}</td>
                  <td style={{ color: 'var(--gray-500)' }}>{p.cp_email ?? '—'}</td>
                  <td><span className="badge badge-gray">{p.pan_card ?? '—'}</span></td>
                  <td><span className="badge badge-blue">{p.lead_count}</span></td>
                  <td style={{ color: 'var(--gray-400)', fontSize: '.8rem' }}>
                    {new Date(p.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="action-btn" title="Edit partner" onClick={() => setEditPartner(p)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className="action-btn danger" title="Delete partner" onClick={() => setDeletePartner(p)}>
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

      {/* Mobile Card List */}
      <div className="mobile-only">
        {fetching ? (
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="mobile-card-skeleton">
                <div className="skeleton-cell w-160" style={{ height: 16, marginBottom: 8 }} />
                <div className="skeleton-cell w-120" style={{ height: 12 }} />
              </div>
            ))}
          </div>
        ) : partners.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <p>No channel partners yet.</p>
            <button className="btn btn-primary btn-sm" onClick={() => setAddOpen(true)}>Add your first partner</button>
          </div>
        ) : (
          <div className="lead-card-list">
            {partners.map(p => (
              <div key={p.id} className="lead-card">
                <div className="lead-card-top">
                  <div>
                    <div className="lead-card-name">{p.name}</div>
                    <div className="lead-card-phone">{p.email}</div>
                  </div>
                  <span className="badge badge-blue">{p.lead_count} leads</span>
                </div>
                <div className="lead-card-meta">
                  {p.pan_card && <span className="lead-card-tag">{p.pan_card}</span>}
                  {p.gender && <span className="lead-card-tag muted" style={{ textTransform: 'capitalize' }}>{p.gender}</span>}
                  {p.cp_email && <span className="lead-card-tag muted">{p.cp_email}</span>}
                </div>
                <div className="lead-card-footer">
                  <span className="lead-card-date">
                    Joined {new Date(p.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <div className="action-btns">
                    <button className="action-btn" onClick={() => setEditPartner(p)} title="Edit">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button className="action-btn danger" onClick={() => setDeletePartner(p)} title="Delete">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Channel Partner" width={580}>
        <PartnerForm onSuccess={fetchPartners} onClose={() => setAddOpen(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={Boolean(editPartner)} onClose={() => setEditPartner(null)} title="Edit Channel Partner" width={580}>
        {editPartner && (
          <PartnerForm initial={editPartner} onSuccess={fetchPartners} onClose={() => setEditPartner(null)} />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={Boolean(deletePartner)} onClose={() => setDeletePartner(null)} title="Delete Channel Partner" width={420}>
        <p style={{ color: 'var(--gray-600)', marginBottom: 8 }}>
          Are you sure you want to delete <strong>{deletePartner?.name}</strong>?
          This will fail if they have active leads assigned.
        </p>
        <div className="modal-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => setDeletePartner(null)}>Cancel</button>
          <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? <span className="spinner" /> : 'Delete Partner'}
          </button>
        </div>
      </Modal>
    </>
  );
}
