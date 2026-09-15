import React, { useState, FormEvent } from 'react';
import { toast } from '@/components/ToastContainer';
import { BANK_NAMES } from '@/lib/constants';
import { Lead, LoanType, LeadStatus, ChannelPartner } from './lead-types';

const PROPERTY_ONLY  = new Set(['Legal & Technical', 'Transaction', 'PDD Clearance']);
const PROPERTY_LOANS = new Set(['Home Loan', 'Loan Against Property (LAP)']);

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

export interface LeadFormProps {
  initial?: Partial<Lead>;
  isAdmin: boolean;
  loanTypes: LoanType[];
  statuses: LeadStatus[];
  channelPartners: ChannelPartner[];
  onSuccess: () => void;
  onClose: () => void;
}

export default function LeadForm({ initial, isAdmin, loanTypes, statuses, channelPartners, onSuccess, onClose }: LeadFormProps) {
  const isEdit = Boolean(initial?.id);

  const [fullName,    setFullName]    = useState(initial?.full_name   ?? '');
  const [phone,       setPhone]       = useState(initial?.phone       ?? '');
  const [dob,         setDob]         = useState(initial?.dob         ? initial.dob.split('T')[0] : '');
  
  const defaultStatus = statuses.find(s => s.stage_order === 1) || statuses[0];
  const [statusId,    setStatusId]    = useState(String(initial?.status_id ?? defaultStatus?.id ?? ''));

  const [loanNumber,  setLoanNumber]  = useState(initial?.loan_number  ?? '');
  const [loanTypeId,  setLoanTypeId]  = useState(String(initial?.loan_type_id ?? ''));
  const [cpId,        setCpId]        = useState(initial?.cp_id        ?? '');

  const [loanAmount,  setLoanAmount]  = useState(initial?.loan_amount  ?? '');
  const [bankName,    setBankName]    = useState(initial?.bank_name    ?? '');
  const [loginDate,   setLoginDate]   = useState(initial?.login_date   ? initial.login_date.split('T')[0] : '');
  const [sanctionDate,setSanctionDate]= useState(initial?.sanction_date? initial.sanction_date.split('T')[0] : '');
  const [disbursalDate,setDisbursalDate]=useState(initial?.disbursal_date? initial.disbursal_date.split('T')[0]: '');
  const [transactionDate,setTransactionDate]=useState(initial?.transaction_date? initial.transaction_date.split('T')[0]: '');

  // New fields
  const [company,     setCompany]     = useState(initial?.company    ?? '');
  const [occupation,  setOccupation]  = useState(initial?.occupation ?? '');
  const [salary,      setSalary]      = useState(initial?.salary     ?? '');
  const [turnover,    setTurnover]    = useState(initial?.turnover   ?? '');
  const [location,    setLocation]    = useState(initial?.location   ?? '');

  const [loading,     setLoading]     = useState(false);

  // Inline validation errors
  const [phoneError, setPhoneError]   = useState('');
  const [dobError,   setDobError]     = useState('');
  const [loanAmountError, setLoanAmountError] = useState('');

  const selectedLoanTypeName = loanTypes.find(l => l.id === Number(loanTypeId))?.loan_type ?? '';
  const visibleStatuses = statuses.filter(s =>
    PROPERTY_ONLY.has(s.lead_status) ? PROPERTY_LOANS.has(selectedLoanTypeName) : true,
  );

  const currentStatus = statuses.find(s => s.id === Number(statusId));
  const stageOrder = currentStatus?.stage_order ?? 0;
  const isCreated = stageOrder <= 1;

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

  function validateLoanAmount(value: string) {
    if (!value.trim()) {
      setLoanAmountError('Loan amount is required.');
      return false;
    }
    if (Number.isNaN(Number(value)) || Number(value) <= 0) {
      setLoanAmountError('Enter a valid loan amount.');
      return false;
    }
    setLoanAmountError('');
    return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const phoneOk      = validatePhone(phone);
    const dobOk        = validateDob(dob);
    const loanAmountOk = validateLoanAmount(loanAmount);
    if (!phoneOk || !dobOk || !loanAmountOk) return;
    setLoading(true);

    const body = {
      full_name:    fullName,
      phone,
      dob:          dob || null,
      status_id:    Number(statusId),
      loan_number:  isCreated ? null : (loanNumber || null),
      loan_type_id: Number(loanTypeId),
      loan_amount:  loanAmount || null,
      bank_name:    bankName || null,
      login_date:   (stageOrder >= 2) ? (loginDate || null) : null,
      sanction_date:(stageOrder >= 3) ? (sanctionDate || null) : null,
      disbursal_date:(stageOrder >= 4) ? (disbursalDate || null) : null,
      transaction_date: (PROPERTY_LOANS.has(selectedLoanTypeName) && stageOrder >= 6) ? (transactionDate || null) : null,
      company:    company    || null,
      occupation: occupation || null,
      salary:     occupation === 'salaried'      ? (salary   || null) : null,
      turnover:   occupation === 'self_employed' ? (turnover || null) : null,
      location:   location   || null,
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
      const d = await res.json().catch(() => ({ error: 'Unknown error' }));
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
          <select id="lf-loan-type" value={loanTypeId} onChange={e => setLoanTypeId(e.target.value)} required>
            <option value="">Select type</option>
            {loanTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.loan_type}</option>)}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="lf-loan-amount">Loan Amount <span className="req">*</span></label>
          <input
            id="lf-loan-amount"
            type="number"
            step="0.01"
            placeholder="500000"
            value={loanAmount}
            onChange={e => {
              setLoanAmount(e.target.value);
              if (loanAmountError) validateLoanAmount(e.target.value);
            }}
            onBlur={() => validateLoanAmount(loanAmount)}
            required
          />
          {loanAmountError && <span className="field-error">{loanAmountError}</span>}
        </div>
        <div className="field">
          <label htmlFor="lf-bank">Bank <span className="req">*</span></label>
          <select id="lf-bank" value={bankName} onChange={e => setBankName(e.target.value)} required>
            <option value="">Select bank</option>
            {BANK_NAMES.map(bank => <option key={bank} value={bank}>{bank}</option>)}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="lf-status">Lead Status <span className="req">*</span></label>
          <select id="lf-status" value={statusId} onChange={e => setStatusId(e.target.value)} required>
            <option value="">Select status</option>
            {visibleStatuses.map(s => <option key={s.id} value={s.id}>{s.lead_status}</option>)}
          </select>
        </div>
        {!isCreated ? (
          <div className="field">
            <label htmlFor="lf-loan-num">Loan Number <span className="opt">(optional)</span></label>
            <input id="lf-loan-num" type="text" placeholder="LN-00123" value={loanNumber} onChange={e => setLoanNumber(e.target.value)} />
          </div>
        ) : (
          <div className="field" />
        )}
      </div>

      <div className="form-row">
        {stageOrder >= 2 && (
          <div className="field">
            <label htmlFor="lf-login-date">Login Date</label>
            <input id="lf-login-date" type="date" value={loginDate} onChange={e => setLoginDate(e.target.value)} />
          </div>
        )}
        {stageOrder >= 3 && (
          <div className="field">
            <label htmlFor="lf-sanction-date">Sanction Date</label>
            <input id="lf-sanction-date" type="date" value={sanctionDate} onChange={e => setSanctionDate(e.target.value)} />
          </div>
        )}
      </div>

      <div className="form-row">
        {stageOrder >= 4 && (
          <div className="field">
            <label htmlFor="lf-disbursal-date">Disbursal Date</label>
            <input id="lf-disbursal-date" type="date" value={disbursalDate} onChange={e => setDisbursalDate(e.target.value)} />
          </div>
        )}
        {PROPERTY_LOANS.has(selectedLoanTypeName) && stageOrder >= 6 && (
          <div className="field">
            <label htmlFor="lf-transaction-date">Transaction Date</label>
            <input id="lf-transaction-date" type="date" value={transactionDate} onChange={e => setTransactionDate(e.target.value)} />
          </div>
        )}
      </div>

      {/* ── Applicant Profile ── */}
      <div className="form-row">
        <div className="field">
          <label htmlFor="lf-company">Company / Employer</label>
          <input id="lf-company" type="text" placeholder="ABC Pvt Ltd" value={company} onChange={e => setCompany(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="lf-location">Location</label>
          <input id="lf-location" type="text" placeholder="Mumbai, Maharashtra" value={location} onChange={e => setLocation(e.target.value)} />
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="lf-occupation">Occupation</label>
          <select id="lf-occupation" value={occupation} onChange={e => { setOccupation(e.target.value); setSalary(''); setTurnover(''); }}>
            <option value="">Select occupation</option>
            <option value="salaried">Salaried</option>
            <option value="self_employed">Self Employed</option>
          </select>
        </div>
        {occupation === 'salaried' && (
          <div className="field">
            <label htmlFor="lf-salary">Monthly Salary (₹)</label>
            <input id="lf-salary" type="number" step="0.01" placeholder="50000" value={salary} onChange={e => setSalary(e.target.value)} />
          </div>
        )}
        {occupation === 'self_employed' && (
          <div className="field">
            <label htmlFor="lf-turnover">Annual Turnover (₹)</label>
            <input id="lf-turnover" type="number" step="0.01" placeholder="1200000" value={turnover} onChange={e => setTurnover(e.target.value)} />
          </div>
        )}
        {!occupation && <div className="field" />}
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
