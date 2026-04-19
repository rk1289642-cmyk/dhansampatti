'use client';

import { useState, FormEvent } from 'react';

interface Props {
  onSuccess?: () => void;
}

export default function AddChannelPartnerForm({ onSuccess }: Props) {
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender]   = useState('');
  const [cpEmail, setCpEmail] = useState('');
  const [panCard, setPanCard] = useState('');

  const [loading, setLoading] = useState(false);
  const [toast, setToast]     = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch('/api/users/channel-partners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, address, gender, cp_email: cpEmail, pan_card: panCard }),
    });

    setLoading(false);

    if (!res.ok) {
      const d = await res.json();
      showToast(d.error ?? 'Failed to add channel partner.', 'error');
      return;
    }

    showToast('Channel partner added!', 'success');
    setName(''); setEmail(''); setPassword(''); setAddress(''); setGender(''); setCpEmail(''); setPanCard('');
    onSuccess?.();
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          <div className="field">
            <label htmlFor="cp-name">Full Name <span style={{color:'var(--danger)'}}>*</span></label>
            <input id="cp-name" type="text" placeholder="Priya Sharma" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="cp-email">Email <span style={{color:'var(--danger)'}}>*</span></label>
            <input id="cp-email" type="email" placeholder="priya@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="cp-password">Password <span style={{color:'var(--danger)'}}>*</span></label>
            <input id="cp-password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="cp-gender">Gender</label>
            <select id="cp-gender" value={gender} onChange={e => setGender(e.target.value)}>
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="cp-address">Address</label>
          <input id="cp-address" type="text" placeholder="123 MG Road, Bengaluru" value={address} onChange={e => setAddress(e.target.value)} />
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="cp-cp-email">Office Email <span className="opt">(optional)</span></label>
            <input id="cp-cp-email" type="email" placeholder="office@firm.com" value={cpEmail} onChange={e => setCpEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="cp-pan">PAN Card</label>
            <input id="cp-pan" type="text" placeholder="ABCDE1234F" maxLength={10} value={panCard} onChange={e => setPanCard(e.target.value.toUpperCase())} />
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-sm" disabled={loading} style={{ marginTop: 4 }}>
          {loading ? <span className="spinner" /> : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Channel Partner
            </>
          )}
        </button>
      </form>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </>
  );
}
