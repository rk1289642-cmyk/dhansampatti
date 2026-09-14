'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';
import { toast } from '@/components/ToastContainer';
import { useRouter } from 'next/navigation';

export default function EditProfile({ user, isCp }: { user: any, isCp?: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState(user.address || '');
  const [gender, setGender] = useState(user.gender || '');
  const [panCard, setPanCard] = useState(user.pan_card || '');
  const [cpEmail, setCpEmail] = useState(user.cp_email || '');
  
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const body: any = { name, email, address, gender, pan_card: panCard };
    if (password) body.password = password;
    if (isCp) body.cp_email = cpEmail;

    const res = await fetch('/api/users/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      toast(d.error || 'Failed to update profile', 'error');
      return;
    }

    toast('Profile updated successfully', 'success');
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <div style={{ marginTop: '20px' }}>
        <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>Edit Profile & Password</button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Edit Profile" width={500}>
        <form onSubmit={handleSubmit}>
          <div className="field" style={{ marginBottom: '15px' }}>
            <label>Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="field" style={{ marginBottom: '15px' }}>
            <label>Login Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="field" style={{ marginBottom: '15px' }}>
            <label>New Password <span className="opt">(leave blank to keep current)</span></label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: '15px' }}>
            <label>Gender</label>
            <select value={gender} onChange={e => setGender(e.target.value)}>
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="field" style={{ marginBottom: '15px' }}>
            <label>Address</label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: '15px' }}>
            <label>PAN Card</label>
            <input type="text" value={panCard} onChange={e => setPanCard(e.target.value)} />
          </div>
          {isCp && (
            <div className="field" style={{ marginBottom: '15px' }}>
              <label>Office Email</label>
              <input type="email" value={cpEmail} onChange={e => setCpEmail(e.target.value)} />
            </div>
          )}

          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
