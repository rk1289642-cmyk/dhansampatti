export interface LoanType   { id: number; loan_type: string; }
export interface LeadStatus { id: number; lead_status: string; stage_order: number; }
export interface ChannelPartner { id: string; name: string; }

export interface Lead {
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
  loan_amount?: string;
  bank_name?: string;
  login_date?: string;
  sanction_date?: string;
  disbursal_date?: string;
  transaction_date?: string;
  company?: string;
  occupation?: string;
  salary?: string;
  turnover?: string;
  location?: string;
  created_by_name?: string;
  cp_email?: string;
}
